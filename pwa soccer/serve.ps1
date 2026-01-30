# Simple PowerShell static file server using HttpListener
# Usage: powershell -ExecutionPolicy Bypass -NoProfile -File "serve.ps1"
param(
    [int]$Port = 8080
)
try {
    $root = (Get-Location).Path
    $listener = New-Object System.Net.HttpListener
    $prefix = "http://localhost:$Port/"
    $listener.Prefixes.Add($prefix)
    $listener.Start()
    Write-Output "Serving $root on $prefix"
    while ($true) {
        $context = $listener.GetContext()
        $req = $context.Request
        $localPath = $req.Url.LocalPath
        if ($localPath -eq '/' -or $localPath -eq '') { $localPath = 'index.html' } else { $localPath = $localPath.TrimStart('/') }
        $file = Join-Path $root $localPath
        if (Test-Path $file -PathType Leaf) {
            try {
                $bytes = [System.IO.File]::ReadAllBytes($file)
                $ext = [System.IO.Path]::GetExtension($file).ToLower()
                switch ($ext) {
                    '.html' { $context.Response.ContentType = 'text/html' }
                    '.css'  { $context.Response.ContentType = 'text/css' }
                    '.js'   { $context.Response.ContentType = 'application/javascript' }
                    '.svg'  { $context.Response.ContentType = 'image/svg+xml' }
                    '.png'  { $context.Response.ContentType = 'image/png' }
                    '.jpg'  { $context.Response.ContentType = 'image/jpeg' }
                    default { $context.Response.ContentType = 'application/octet-stream' }
                }
                $context.Response.ContentLength64 = $bytes.Length
                $context.Response.StatusCode = 200
                $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
                $context.Response.OutputStream.Close()
            } catch {
                Write-Output "Serve file error: $_"
            }
        } else {
            $context.Response.StatusCode = 404
            $context.Response.OutputStream.Close()
        }
    }
} catch {
    Write-Output "Server failed to start: $_"
} finally {
    if ($listener -and $listener.IsListening) {
        try { $listener.Stop() } catch {}
    }
}
