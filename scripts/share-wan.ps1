param(
  [int]$FrontendPort = 3000,
  [int]$BackendPort = 5000,
  [switch]$SkipBackend
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$FrontendDir = Join-Path $Root "frontend"
$BackendDir = Join-Path $Root "backend"
$LogDir = Join-Path $Root ".codex-logs"
$ToolsDir = Join-Path $Root ".tools"
$CloudflaredPath = Join-Path $ToolsDir "cloudflared.exe"
$TunnelLog = Join-Path $LogDir "cloudflared.log"
$FrontendLog = Join-Path $LogDir "frontend-share.log"
$BackendLog = Join-Path $LogDir "backend-share.log"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
New-Item -ItemType Directory -Force -Path $ToolsDir | Out-Null

function Test-PortOpen {
  param([int]$Port)
  try {
    $client = [Net.Sockets.TcpClient]::new()
    $async = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    $ok = $async.AsyncWaitHandle.WaitOne(400)
    if ($ok) { $client.EndConnect($async) }
    $client.Close()
    return $ok
  } catch {
    return $false
  }
}

function Start-CommuniumProcess {
  param(
    [string]$Name,
    [string]$WorkingDirectory,
    [string]$Command,
    [string[]]$Arguments,
    [string]$LogPath
  )

  Write-Host "Starting $Name..."
  $ErrorLogPath = "$LogPath.err"
  $ArgumentLine = ($Arguments | ForEach-Object {
    $value = [string]$_
    if ($value -match '[\s"]') {
      '"' + ($value -replace '"', '\"') + '"'
    } else {
      $value
    }
  }) -join " "
  return Start-Process `
    -FilePath $Command `
    -ArgumentList $ArgumentLine `
    -WorkingDirectory $WorkingDirectory `
    -RedirectStandardOutput $LogPath `
    -RedirectStandardError $ErrorLogPath `
    -WindowStyle Hidden `
    -PassThru
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is required before sharing Communium."
}

$NpmCommandInfo = Get-Command npm.cmd -ErrorAction SilentlyContinue
$NpmCommand = if ($NpmCommandInfo) { $NpmCommandInfo.Source } else { $null }
if (-not $NpmCommand) {
  $NpmCommand = (Get-Command npm -ErrorAction Stop).Source
}

if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
  Write-Host "Installing frontend dependencies..."
  Push-Location $FrontendDir
  & $NpmCommand install
  Pop-Location
}

if (-not $SkipBackend -and -not (Test-Path (Join-Path $BackendDir "node_modules"))) {
  Write-Host "Installing backend dependencies..."
  Push-Location $BackendDir
  & $NpmCommand install
  Pop-Location
}

if (-not $SkipBackend -and -not (Test-PortOpen -Port $BackendPort)) {
  $env:PORT = "$BackendPort"
  Start-CommuniumProcess -Name "backend" -WorkingDirectory $BackendDir -Command $NpmCommand -Arguments @("start") -LogPath $BackendLog | Out-Null
} else {
  Write-Host "Backend already available on port $BackendPort."
}

if (-not (Test-PortOpen -Port $FrontendPort)) {
  $env:BACKEND_INTERNAL_URL = "http://localhost:$BackendPort"
  $env:BACKEND_URL = "http://localhost:$BackendPort"
  Start-CommuniumProcess -Name "frontend" -WorkingDirectory $FrontendDir -Command $NpmCommand -Arguments @("run", "dev", "--", "-p", "$FrontendPort") -LogPath $FrontendLog | Out-Null
} else {
  Write-Host "Frontend already available on port $FrontendPort."
}

Write-Host "Waiting for frontend http://localhost:$FrontendPort ..."
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
  if (Test-PortOpen -Port $FrontendPort) {
    $ready = $true
    break
  }
  Start-Sleep -Seconds 1
}

if (-not $ready) {
  throw "Frontend did not become ready. Check $FrontendLog"
}

if (-not (Test-Path $CloudflaredPath)) {
  $existingCloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
  if ($existingCloudflared) {
    $CloudflaredPath = $existingCloudflared.Source
  } else {
    Write-Host "Downloading cloudflared..."
    $downloadUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    Invoke-WebRequest -Uri $downloadUrl -OutFile $CloudflaredPath
  }
}

if (Test-Path $TunnelLog) {
  Remove-Item -LiteralPath $TunnelLog -Force
}

Write-Host "Starting Cloudflare Tunnel for http://localhost:$FrontendPort ..."
$cloudflared = Start-CommuniumProcess `
  -Name "cloudflared" `
  -WorkingDirectory $Root `
  -Command $CloudflaredPath `
  -Arguments @("--logfile", $TunnelLog, "tunnel", "--url", "http://localhost:$FrontendPort", "--no-autoupdate") `
  -LogPath "$TunnelLog.out"

$publicUrl = $null
for ($i = 0; $i -lt 45; $i++) {
  if (Test-Path $TunnelLog) {
    $content = Get-Content -LiteralPath $TunnelLog -Raw -ErrorAction SilentlyContinue
    if ($content -match "https://[-a-z0-9]+\.trycloudflare\.com") {
      $publicUrl = $Matches[0]
      break
    }
  }
  Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "Communium local:  http://localhost:$FrontendPort"
if ($publicUrl) {
  Write-Host "Communium public: $publicUrl"
} else {
  Write-Host "Tunnel started, but the public URL was not detected yet. Check $TunnelLog"
}
Write-Host ""
Write-Host "Logs:"
Write-Host "  Frontend: $FrontendLog"
Write-Host "  Backend:  $BackendLog"
Write-Host "  Tunnel:   $TunnelLog"
Write-Host ""
Write-Host "Keep this PowerShell window open while sharing the temporary link."

Wait-Process -Id $cloudflared.Id
