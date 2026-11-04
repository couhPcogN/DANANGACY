param([string[]]$FrameIds)

$repoRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $repoRoot 'design\exports\manifest.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$previewDir = Join-Path $repoRoot 'design\previews'
$profileDir = Join-Path $repoRoot '.tmp\chrome-reference-profile'
New-Item -ItemType Directory -Force -Path $previewDir,$profileDir | Out-Null

$frames = @($manifest.frames)
if ($FrameIds.Count -gt 0) {
    $frames = @($frames | Where-Object { $FrameIds -contains $_.id })
}
foreach ($frame in $frames) {
    $source = Join-Path $repoRoot ("design\exports\" + $frame.source)
    $target = Join-Path $previewDir ($frame.id + '.png')
    if (Test-Path -LiteralPath $target) { continue }
    $uri = ([System.Uri]$source).AbsoluteUri
    $window = "$($frame.width),$($frame.height)"
    & $chrome '--headless=new' '--disable-gpu' '--hide-scrollbars' '--no-first-run' "--user-data-dir=$profileDir" "--window-size=$window" "--screenshot=$target" $uri | Out-Null
    if (-not (Test-Path -LiteralPath $target)) { throw "Chrome did not render $($frame.id)" }
    Write-Output $frame.id
}
