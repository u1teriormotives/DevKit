using System.Diagnostics;
using System.Globalization;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;

const int MaxExternalBodySize = 1_000_000;

var baseDirectory = Directory.GetCurrentDirectory();
var dkRoutePath = Path.Combine(baseDirectory, "DKRoute.json");

if (!File.Exists(dkRoutePath))
{
    FatalException();
    throw new ErrorException($"Expected DKRoute.json at {dkRoutePath}, file does not exist.");
}

var configuration = await LoadConfigurationAsync(dkRoutePath, baseDirectory);

if (configuration.UseHttp2 && !configuration.UseHttps)
{
    FatalException();
    throw new ErrorException("You must enable HTTPS in order to HTTP/2");
}

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(configuration.Port, listenOptions =>
    {
        listenOptions.Protocols = configuration.UseHttp2 ? HttpProtocols.Http2 : HttpProtocols.Http1;

        if (configuration.UseHttps)
        {
            listenOptions.UseHttps(configuration.Certificate!);
        }
    });
});

var app = builder.Build();

app.Run(context => HandleRequestAsync(context, configuration));

await app.StartAsync();
Console.WriteLine(
    $"{CurrentTime()} :: listening at {(configuration.UseHttps ? "https" : "http")}://localhost:{configuration.Port}");

try
{
    await app.WaitForShutdownAsync();
}
finally
{
    configuration.Certificate?.Dispose();
}

static async Task<ServerConfiguration> LoadConfigurationAsync(string dkRoutePath, string baseDirectory)
{
    var rawData = (await File.ReadAllTextAsync(dkRoutePath, Encoding.UTF8)).Trim();
    if (string.IsNullOrWhiteSpace(rawData))
    {
        FatalException();
        throw new ErrorException($"No data exists in DKRoute.json (found @ {dkRoutePath})");
    }

    JsonDocument document;
    try
    {
        document = JsonDocument.Parse(rawData);
    }
    catch (JsonException)
    {
        FatalException();
        throw new ErrorException($"DKRoute.json is not valid JSON (found @ {dkRoutePath})");
    }

    using (document)
    {
        var root = document.RootElement;
        if (!root.TryGetProperty("$", out var metadata))
        {
            FatalException();
            throw new ErrorException($"No metadata found in DKRoute.json (found @ {dkRoutePath})");
        }

        if (!TryGetProperty(metadata, "port", out var portElement) || !IsJavaScriptTruthy(portElement))
        {
            FatalException();
            throw new ErrorException($"No port found in DKRoute.json (found @ {dkRoutePath})");
        }

        if (!TryGetPort(portElement, out var port) || port > 65535 || port < 0)
        {
            FatalException();
            throw new ErrorException($"Port provided ({portElement.GetRawText()}) invalid");
        }

        var useHttps = TryGetProperty(metadata, "useHttps", out var useHttpsElement) && IsJavaScriptTruthy(useHttpsElement);
        var useHttp2 = TryGetProperty(metadata, "useHttp2", out var useHttp2Element) && IsJavaScriptTruthy(useHttp2Element);

        X509Certificate2? certificate = null;
        if (useHttps)
        {
            if (!TryGetProperty(metadata, "httpsConfig", out var httpsConfig) ||
                httpsConfig.ValueKind != JsonValueKind.Object ||
                !TryGetProperty(httpsConfig, "cert", out var certElement) ||
                !IsJavaScriptTruthy(certElement) ||
                !TryGetProperty(httpsConfig, "key", out var keyElement) ||
                !IsJavaScriptTruthy(keyElement))
            {
                FatalException();
                throw new ErrorException($"HTTPS Config malformed or does not exist (found @ {dkRoutePath})");
            }

            var certRelativePath = GetPathString(certElement);
            var keyRelativePath = GetPathString(keyElement);
            var certPath = Path.Combine(baseDirectory, certRelativePath);
            var keyPath = Path.Combine(baseDirectory, keyRelativePath);
            certificate = LoadCertificate(certPath, keyPath);
        }

        var validRoutes = new Dictionary<string, RouteDefinition>(StringComparer.Ordinal);
        var routePaths = new HashSet<string>(StringComparer.Ordinal);
        var externalRunnerPath = Path.Combine(baseDirectory, "dkroute-external-runner.mjs");

        foreach (var property in root.EnumerateObject())
        {
            if (!property.Name.StartsWith("/", StringComparison.Ordinal))
            {
                continue;
            }

            var route = property.Name;
            if (property.Value.ValueKind != JsonValueKind.Array)
            {
                NonfatalException();
                Console.Error.WriteLine(
                    $"Route {route} has invalid schema: {GetJavaScriptTypeName(property.Value)} invalid type; looking for Array<Object>. Continuing...");
                continue;
            }

            foreach (var method in property.Value.EnumerateArray())
            {
                var verbDisplay = GetJavaScriptDisplayValue(method, "requestType");
                if (!TryGetStringProperty(method, "requestType", out var verb) ||
                    !RouterConstants.ValidVerbs.Contains(verb!))
                {
                    NonfatalException();
                    Console.Error.WriteLine($"{verbDisplay} {route} has invalid requestType. Continuing...");
                    continue;
                }

                if (!TryGetStringProperty(method, "file", out var configuredFile))
                {
                    NonfatalException();
                    Console.Error.WriteLine($"{verb} {route} has invalid file configuration. Continuing...");
                    continue;
                }

                var resolvedFile = Path.Combine(baseDirectory, configuredFile!);
                if (!File.Exists(resolvedFile))
                {
                    NonfatalException();
                    Console.Error.WriteLine($"{verb} {route} has invalid file configuration. Continuing...");
                    continue;
                }

                var routeKey = $"{verb!.ToUpperInvariant()} {route}";
                if (TryGetProperty(method, "externalFunction", out var externalElement) &&
                    IsJavaScriptTruthy(externalElement))
                {
                    if (!await ExternalHandlerInvoker.ValidateAsync(externalRunnerPath, resolvedFile, baseDirectory))
                    {
                        NonfatalException();
                        Console.Error.WriteLine(
                            $"{verb} {route} has invalid external function in {configuredFile}. Continuing...");
                        continue;
                    }

                    validRoutes[routeKey] = new RouteDefinition
                    {
                        External = true,
                        FilePath = resolvedFile
                    };
                    routePaths.Add(route);
                    continue;
                }

                validRoutes[routeKey] = new RouteDefinition
                {
                    External = false,
                    FilePath = resolvedFile,
                    FileType = TryGetStringProperty(method, "contentType", out var contentType)
                        ? contentType
                        : RouterConstants.MimeTypes.TryGetValue(Path.GetExtension(configuredFile!).ToLowerInvariant(), out var inferredType)
                            ? inferredType
                            : "text/plain"
                };
                routePaths.Add(route);
            }
        }

        return new ServerConfiguration
        {
            BaseDirectory = baseDirectory,
            Certificate = certificate,
            ExternalRunnerPath = externalRunnerPath,
            Port = port,
            Routes = routePaths,
            UseHttp2 = useHttp2,
            UseHttps = useHttps,
            ValidRoutes = validRoutes
        };
    }
}

static async Task HandleRequestAsync(HttpContext context, ServerConfiguration configuration)
{
    var method = context.Request.Method;
    var requestUrl = $"{context.Request.PathBase}{context.Request.Path}{context.Request.QueryString}";
    var requestId = Guid.NewGuid().ToString();

    Console.WriteLine(
        $"{CurrentTime()} :: New request detected: {method ?? "REQUEST"} {requestUrl ?? "nil"} - assigned RequestID:{requestId}");

    var pathname = context.Request.Path.Value ?? "/";
    if (!configuration.Routes.Contains(pathname))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        context.Response.Headers["Content-Type"] = "text/plain; charset=utf-8";
        await context.Response.WriteAsync($"ERROR 404 {method} {pathname} not valid resource");
        return;
    }

    var routeKey = $"{method?.ToUpperInvariant()} {pathname}";
    if (string.IsNullOrEmpty(method) || !configuration.ValidRoutes.ContainsKey(routeKey))
    {
        context.Response.StatusCode = StatusCodes.Status405MethodNotAllowed;
        context.Response.Headers["Content-Type"] = "text/plain; charset=utf-8";
        Console.WriteLine(
            $"{CurrentTime()} :: RequestID::{requestId} - invalid HTTP method (returning 405)");
        await context.Response.WriteAsync(
            $"ERROR 405 {method ?? "REQUEST"} {pathname} uses incorrect method");
        return;
    }

    if (!configuration.ValidRoutes.TryGetValue(routeKey, out var routeData))
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.Headers["Content-Type"] = "application/json; charset=utf-8";
        await context.Response.WriteAsync(
            JsonSerializer.Serialize(new
            {
                error = 500,
                response = "error while retrieving data; try again later"
            }));

        NonfatalException();
        Console.Error.WriteLine(
            $"RequestID:{requestId} - unknown error while retrieving data (returning 500)");
        Console.Error.WriteLine(
            $"RequestID:{requestId} - could be that key was removed after .has() check");
        return;
    }

    if (!routeData.External)
    {
        await HandleStaticRouteAsync(context, configuration, requestId, pathname, routeData);
        return;
    }

    await HandleExternalRouteAsync(context, configuration, requestId, pathname, routeData);
}

static async Task HandleStaticRouteAsync(
    HttpContext context,
    ServerConfiguration configuration,
    string requestId,
    string pathname,
    RouteDefinition routeData)
{
    if (HttpMethods.IsHead(context.Request.Method))
    {
        var getKey = $"GET {pathname}";
        if (!configuration.ValidRoutes.TryGetValue(getKey, out var headRoute))
        {
            context.Response.StatusCode = StatusCodes.Status405MethodNotAllowed;
            context.Response.Headers["Content-Type"] = "text/plain; charset=utf-8";
            return;
        }

        if (!headRoute.External)
        {
            try
            {
                var fileInfo = new FileInfo(headRoute.FilePath!);
                context.Response.StatusCode = StatusCodes.Status200OK;
                context.Response.Headers["Content-Type"] = headRoute.FileType!;
                context.Response.ContentLength = fileInfo.Length;
                return;
            }
            catch
            {
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                return;
            }
        }

        try
        {
            var result = await ExternalHandlerInvoker.InvokeAsync(
                configuration.ExternalRunnerPath,
                headRoute.FilePath!,
                configuration.BaseDirectory,
                new ExternalRequestData
                {
                    Body = string.Empty,
                    Headers = GetRequestHeaders(context.Request.Headers),
                    Method = context.Request.Method,
                    Url = $"{context.Request.PathBase}{context.Request.Path}{context.Request.QueryString}"
                });

            if (!result.HasValidSchema)
            {
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                return;
            }

            context.Response.StatusCode = result.GetStatusCode();
            ApplyHeaders(context.Response.Headers, result.Headers);
            return;
        }
        catch
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            return;
        }
    }

    try
    {
        var fileContent = await File.ReadAllBytesAsync(routeData.FilePath!, context.RequestAborted);
        context.Response.StatusCode = StatusCodes.Status200OK;
        context.Response.Headers["Content-Type"] = routeData.FileType!;
        await context.Response.Body.WriteAsync(fileContent, context.RequestAborted);
        Console.WriteLine($"{CurrentTime()} :: RequestID:{requestId} - successful (returning 200)");
    }
    catch (Exception error)
    {
        NonfatalException();
        Console.Error.WriteLine($"RequestID:{requestId} - {error}");
        Console.WriteLine($"RequestID:{requestId} - returning 500");

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.Headers["Content-Type"] = "text/plain; charset=utf-8";
        await context.Response.WriteAsync("500 error retrieving file content");
    }
}

static async Task HandleExternalRouteAsync(
    HttpContext context,
    ServerConfiguration configuration,
    string requestId,
    string pathname,
    RouteDefinition routeData)
{
    string body = string.Empty;
    if (HttpMethods.IsPost(context.Request.Method) ||
        HttpMethods.IsPut(context.Request.Method) ||
        HttpMethods.IsPatch(context.Request.Method))
    {
        var bodyRead = await TryReadBodyAsync(context.Request, MaxExternalBodySize, context.RequestAborted);
        if (!bodyRead.Success)
        {
            context.Abort();
            return;
        }

        body = bodyRead.Body;
    }

    try
    {
        var result = await ExternalHandlerInvoker.InvokeAsync(
            configuration.ExternalRunnerPath,
            routeData.FilePath!,
            configuration.BaseDirectory,
            new ExternalRequestData
            {
                Body = body,
                Headers = GetRequestHeaders(context.Request.Headers),
                Method = context.Request.Method,
                Url = $"{context.Request.PathBase}{context.Request.Path}{context.Request.QueryString}"
            });

        if (!result.HasValidSchema)
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.Headers["Content-Type"] = "text/plain; charset=utf-8";
            await context.Response.WriteAsync("500 invalid return schema");

            NonfatalException();
            Console.Error.WriteLine(
                $"RequestID:{requestId} - invalid return schema for resource {pathname} (returning 500)");
            return;
        }

        context.Response.StatusCode = result.GetStatusCode();
        ApplyHeaders(context.Response.Headers, result.Headers);
        await context.Response.WriteAsync(result.Content);
        Console.WriteLine(
            $"{CurrentTime()} :: RequestID:{requestId} - successful (returning {context.Response.StatusCode})");
    }
    catch (Exception error)
    {
        NonfatalException();
        Console.Error.WriteLine($"RequestID:{requestId} - external handler failed: {error}");
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.Headers["Content-Type"] = "text/plain; charset=utf-8";
        await context.Response.WriteAsync("500 internal server error");
    }
}

static async Task<BodyReadResult> TryReadBodyAsync(HttpRequest request, int maxBodySize, CancellationToken cancellationToken)
{
    using var buffer = new MemoryStream();
    var chunk = new byte[8192];

    while (true)
    {
        var read = await request.Body.ReadAsync(chunk.AsMemory(0, chunk.Length), cancellationToken);
        if (read == 0)
        {
            break;
        }

        if (buffer.Length + read > maxBodySize)
        {
            return new BodyReadResult(false, string.Empty);
        }

        await buffer.WriteAsync(chunk.AsMemory(0, read), cancellationToken);
    }

    return new BodyReadResult(true, Encoding.UTF8.GetString(buffer.ToArray()));
}

static Dictionary<string, string> GetRequestHeaders(IHeaderDictionary headers)
{
    var mapped = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    foreach (var header in headers)
    {
        mapped[header.Key] = header.Value.ToString();
    }

    return mapped;
}

static void ApplyHeaders(IHeaderDictionary destination, IReadOnlyDictionary<string, StringValues> source)
{
    foreach (var header in source)
    {
        destination[header.Key] = header.Value;
    }
}

static X509Certificate2 LoadCertificate(string certPath, string keyPath)
{
    using var certificate = X509Certificate2.CreateFromPemFile(certPath, keyPath);
    return X509CertificateLoader.LoadPkcs12(certificate.Export(X509ContentType.Pkcs12), password: null);
}

static bool TryGetProperty(JsonElement element, string name, out JsonElement value)
{
    if (element.ValueKind == JsonValueKind.Object && element.TryGetProperty(name, out value))
    {
        return true;
    }

    value = default;
    return false;
}

static bool TryGetStringProperty(JsonElement element, string name, out string? value)
{
    if (TryGetProperty(element, name, out var property) && property.ValueKind == JsonValueKind.String)
    {
        value = property.GetString();
        return true;
    }

    value = null;
    return false;
}

static bool TryGetPort(JsonElement element, out int port)
{
    if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out port))
    {
        return true;
    }

    port = default;
    return false;
}

static bool IsJavaScriptTruthy(JsonElement element) =>
    element.ValueKind switch
    {
        JsonValueKind.Undefined => false,
        JsonValueKind.Null => false,
        JsonValueKind.False => false,
        JsonValueKind.True => true,
        JsonValueKind.String => !string.IsNullOrEmpty(element.GetString()),
        JsonValueKind.Number => element.TryGetDouble(out var number) && number != 0 && !double.IsNaN(number),
        JsonValueKind.Object => true,
        JsonValueKind.Array => true,
        _ => false
    };

static string GetJavaScriptTypeName(JsonElement element) =>
    element.ValueKind switch
    {
        JsonValueKind.String => "string",
        JsonValueKind.Number => "number",
        JsonValueKind.True => "boolean",
        JsonValueKind.False => "boolean",
        JsonValueKind.Null => "object",
        JsonValueKind.Object => "object",
        JsonValueKind.Array => "object",
        _ => "undefined"
    };

static string GetJavaScriptDisplayValue(JsonElement element, string propertyName)
{
    if (!TryGetProperty(element, propertyName, out var value))
    {
        return "undefined";
    }

    return value.ValueKind switch
    {
        JsonValueKind.String => value.GetString() ?? "undefined",
        JsonValueKind.Number => value.GetRawText(),
        JsonValueKind.True => "true",
        JsonValueKind.False => "false",
        JsonValueKind.Null => "null",
        JsonValueKind.Array => value.GetRawText(),
        JsonValueKind.Object => value.GetRawText(),
        _ => "undefined"
    };
}

static string GetPathString(JsonElement element) =>
    element.ValueKind switch
    {
        JsonValueKind.String => element.GetString() ?? string.Empty,
        _ => element.GetRawText()
    };

static string CurrentTime()
{
    var now = DateTime.Now;
    var hours = now.Hour < 10 ? $"0{now.Hour}" : now.Hour.ToString(CultureInfo.InvariantCulture);
    var minutes = now.Minute < 10 ? $"0{now.Minute}" : now.Minute.ToString(CultureInfo.InvariantCulture);
    return $"\x1b[4;94;40mDEVKIT\x1b[0m::\x1b[4;94;40m{hours}:{minutes}\x1b[0m";
}

static void FatalException() =>
    Console.Error.WriteLine($"{CurrentTime()} :: \x1b[41mFATAL EXCEPTION\x1b[0m");

static void NonfatalException() =>
    Console.Error.WriteLine($"{CurrentTime()} :: \x1b[44mNONFATAL EXCEPTION\x1b[0m");

sealed class ServerConfiguration
{
    public required string BaseDirectory { get; init; }
    public X509Certificate2? Certificate { get; init; }
    public required string ExternalRunnerPath { get; init; }
    public required int Port { get; init; }
    public required HashSet<string> Routes { get; init; }
    public required bool UseHttp2 { get; init; }
    public required bool UseHttps { get; init; }
    public required Dictionary<string, RouteDefinition> ValidRoutes { get; init; }
}

sealed class RouteDefinition
{
    public required bool External { get; init; }
    public required string FilePath { get; init; }
    public string? FileType { get; init; }
}

sealed class ExternalRequestData
{
    public required string Body { get; init; }
    public required Dictionary<string, string> Headers { get; init; }
    public required string Method { get; init; }
    public required string Url { get; init; }
}

readonly record struct BodyReadResult(bool Success, string Body);

sealed class ExternalInvocationResult
{
    public required JsonElement ContentElement { get; init; }
    public required JsonElement HeadersElement { get; init; }
    public required bool HasValidSchema { get; init; }
    public required JsonElement StatusCodeElement { get; init; }
    public string Content => ContentElement.GetString() ?? string.Empty;

    public IReadOnlyDictionary<string, StringValues> Headers
    {
        get
        {
            var headers = new Dictionary<string, StringValues>(StringComparer.OrdinalIgnoreCase);
            foreach (var property in HeadersElement.EnumerateObject())
            {
                headers[property.Name] = ConvertHeaderValue(property.Value);
            }

            return headers;
        }
    }

    public int GetStatusCode()
    {
        if (StatusCodeElement.ValueKind != JsonValueKind.Number || !StatusCodeElement.TryGetInt32(out var statusCode))
        {
            throw new InvalidOperationException("External handler returned a non-integer status code.");
        }

        return statusCode;
    }

    public static ExternalInvocationResult Invalid() =>
        new()
        {
            ContentElement = default,
            HasValidSchema = false,
            HeadersElement = default,
            StatusCodeElement = default
        };

    public static ExternalInvocationResult Create(JsonElement statusCode, JsonElement headers, JsonElement content) =>
        new()
        {
            ContentElement = content.Clone(),
            HasValidSchema = statusCode.ValueKind == JsonValueKind.Number &&
                             headers.ValueKind == JsonValueKind.Object &&
                             content.ValueKind == JsonValueKind.String,
            HeadersElement = headers.Clone(),
            StatusCodeElement = statusCode.Clone()
        };

    private static StringValues ConvertHeaderValue(JsonElement value) =>
        value.ValueKind switch
        {
            JsonValueKind.String => value.GetString(),
            JsonValueKind.Number => value.GetRawText(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            JsonValueKind.Null => string.Empty,
            JsonValueKind.Array => new StringValues(value.EnumerateArray().Select(ConvertArrayItem).ToArray()),
            _ => value.GetRawText()
        };

    private static string ConvertArrayItem(JsonElement item) =>
        item.ValueKind switch
        {
            JsonValueKind.String => item.GetString() ?? string.Empty,
            JsonValueKind.Number => item.GetRawText(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            JsonValueKind.Null => string.Empty,
            _ => item.GetRawText()
        };
}

static class ExternalHandlerInvoker
{
    public static async Task<bool> ValidateAsync(string runnerPath, string handlerPath, string workingDirectory)
    {
        var result = await RunNodeAsync(runnerPath, handlerPath, workingDirectory, "validate", null);
        return result.ExitCode == 0;
    }

    public static async Task<ExternalInvocationResult> InvokeAsync(
        string runnerPath,
        string handlerPath,
        string workingDirectory,
        ExternalRequestData requestData)
    {
        var payload = JsonSerializer.Serialize(requestData);
        var result = await RunNodeAsync(runnerPath, handlerPath, workingDirectory, "invoke", payload);

        if (result.ExitCode != 0)
        {
            throw new InvalidOperationException(string.IsNullOrWhiteSpace(result.StandardError)
                ? "Node runner failed."
                : result.StandardError.Trim());
        }

        JsonDocument responseDocument;
        try
        {
            responseDocument = JsonDocument.Parse(result.StandardOutput);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException("External handler returned invalid JSON.", ex);
        }

        using (responseDocument)
        {
            var root = responseDocument.RootElement;
            if (root.ValueKind != JsonValueKind.Array || root.GetArrayLength() < 3)
            {
                return ExternalInvocationResult.Invalid();
            }

            return ExternalInvocationResult.Create(root[0], root[1], root[2]);
        }
    }

    private static async Task<ProcessResult> RunNodeAsync(
        string runnerPath,
        string handlerPath,
        string workingDirectory,
        string mode,
        string? standardInput)
    {
        using var process = new Process();
        process.StartInfo = new ProcessStartInfo
        {
            FileName = "node",
            WorkingDirectory = workingDirectory,
            RedirectStandardError = true,
            RedirectStandardInput = standardInput is not null,
            RedirectStandardOutput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        process.StartInfo.ArgumentList.Add(runnerPath);
        process.StartInfo.ArgumentList.Add(mode);
        process.StartInfo.ArgumentList.Add(handlerPath);

        process.Start();

        var outputTask = process.StandardOutput.ReadToEndAsync();
        var errorTask = process.StandardError.ReadToEndAsync();

        if (standardInput is not null)
        {
            await process.StandardInput.WriteAsync(standardInput);
            await process.StandardInput.FlushAsync();
            process.StandardInput.Close();
        }

        await process.WaitForExitAsync();

        return new ProcessResult(
            process.ExitCode,
            await outputTask,
            await errorTask);
    }
}

readonly record struct ProcessResult(int ExitCode, string StandardOutput, string StandardError);

sealed class ErrorException : Exception
{
    public ErrorException(string message) : base(message)
    {
    }
}

static class RouterConstants
{
    public static readonly HashSet<string> ValidVerbs = new(StringComparer.OrdinalIgnoreCase)
    {
        "get",
        "post",
        "put",
        "delete",
        "patch",
        "head",
        "options",
        "connect",
        "trace"
    };

    public static readonly IReadOnlyDictionary<string, string> MimeTypes =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [".html"] = "text/html",
            [".htm"] = "text/html",
            [".css"] = "text/css",
            [".js"] = "application/javascript",
            [".json"] = "application/json",
            [".png"] = "image/png",
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".jpe"] = "image/jpeg",
            [".tiff"] = "image/tiff",
            [".tif"] = "image/tiff",
            [".ico"] = "image/x-icon",
            [".svg"] = "image/svg+xml",
            [".webp"] = "image/webp",
            [".csv"] = "text/csv",
            [".tsv"] = "application/tab-separated-values",
            [".dkx"] = "text/dkx"
        };
}
