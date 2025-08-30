using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

using DotNetEnv;
Env.Load();

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseRouting();
app.UseMiddleware<RequestLoggingMiddleware>();

var routesFilePath = Path.Combine(Directory.GetCurrentDirectory(), "DKRoute.json");

if (!File.Exists(routesFilePath)) {
    throw new Exception($"❌ DKRoute.json not found! Looked in: {routesFilePath}");
}

var routeDirectory = Path.GetDirectoryName(routesFilePath) ?? Directory.GetCurrentDirectory();
Console.WriteLine($"🔍 Dynamic route directory: {routeDirectory}");

List<RouteConfig>? routes = null;
try {
    string rawJson = await File.ReadAllTextAsync(routesFilePath);
    routes = JsonSerializer.Deserialize<List<RouteConfig>>(rawJson);
} catch (Exception ex) {
    Console.WriteLine($"🚨 Error loading DKRoute.json: {ex.Message}");
}

if (routes == null || routes.Count == 0) {
    throw new Exception("🚨 ERROR: No valid routes found in DKRoute.json!");
}

foreach (var route in routes) {
    Console.WriteLine($"🔹 Registering route: {route.Route} [{route.RequestType}] => {route.File}");

    _ = app.MapMethods(route.Route, new[] { route.RequestType.ToUpper() }, async (HttpContext context) =>
    {
        Console.WriteLine($"📥 Handling {context.Request.Method} request for {context.Request.Path}");

        var filePath = Path.Combine(routeDirectory, route.File);
        Console.WriteLine($"🔍 Checking file: {filePath}");

        if (!string.IsNullOrEmpty(route.File) && File.Exists(filePath) && !Directory.Exists(filePath))
        {
            var content = await File.ReadAllTextAsync(filePath);
            Console.WriteLine($"📖 File Content Length: {content.Length} bytes");

            context.Response.ContentType = GetMimeType(route.Type);
            await context.Response.WriteAsync(content);
        }
        else
        {
            Console.WriteLine($"🚨 File Not Found: {filePath}");
            await context.Response.WriteAsync("404 file not found");
        }
    });
}

app.MapGet("/test", () => "✅ Test route is working!");

app.Run($"http://*:{Environment.GetEnvironmentVariable("PORT") ?? "80"}");

static string GetMimeType(string type) => type.ToLower() switch {
    "js" or "javascript" => "text/javascript",
    "html" => "text/html",
    "css" => "text/css",
    _ => "text/plain"
};

public class RequestLoggingMiddleware {
    private readonly RequestDelegate _next;

    public RequestLoggingMiddleware(RequestDelegate next) {
        _next = next;
    }

    public async Task Invoke(HttpContext context) {
        Console.WriteLine($"🛠 Middleware detected: {context.Request.Method} {context.Request.Path}");
        await _next(context);
    }
}

public class RouteConfig {
    [JsonPropertyName("route")]
    public string Route { get; set; } = "/";

    [JsonPropertyName("requestType")]
    public string RequestType { get; set; } = "GET";

    [JsonPropertyName("file")]
    public string File { get; set; } = "";

    [JsonPropertyName("type")]
    public string? Type { get; set; }
}