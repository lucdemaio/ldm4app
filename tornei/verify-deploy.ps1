Param(
  [Parameter(Mandatory=$true)] [string]$BaseUrl
)

$endpoints = @(
  "index.html",
  "_framework/dotnet.js",
  "_framework/blazor.webassembly.js",
  "manifest.webmanifest",
  "css/app.css",
  "_content/MudBlazor/MudBlazor.min.js"
)

foreach ($e in $endpoints) {
  $url = $BaseUrl.TrimEnd('/') + '/' + $e
  try {
    $r = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -TimeoutSec 15
    Write-Output "OK  - $url -> $($r.StatusCode) | $($r.Headers['Content-Type'])"
  } catch {
    Write-Output "ERR - $url -> $($_.Exception.Message)"
  }
}
