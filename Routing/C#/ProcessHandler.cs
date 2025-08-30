using System.Diagnostics;
public static class ProcessHandler {
    public static string ExecuteCommand(string command, string args, string? input = null) {
        try {
            var process = new Process() {
                StartInfo = new ProcessStartInfo() {
                    FileName = command,
                    Arguments = args,
                    UseShellExecute = false,
                    RedirectStandardError = true,
                    RedirectStandardOutput = true,
                    RedirectStandardInput = input != null,
                    CreateNoWindow = true,
                }
            };

            process.Start();

            if (input != null) {
                using (var writer = process.StandardInput) {
                    writer.WriteLine(input);
                }
            }

            string output = process.StandardOutput.ReadToEnd();
            string error = process.StandardError.ReadToEnd();
            process.WaitForExit();

            return string.IsNullOrEmpty(error) ? output : $"Error: {error}";
        } catch (Exception ex) {
            return $"Process execution failed: {ex.Message}";
        }
    }
}