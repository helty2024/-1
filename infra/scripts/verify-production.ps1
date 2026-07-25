param(
  [string]$Domain
)

$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$composeFile = Join-Path $root 'infra\docker\docker-compose.production.yml'
$envFile = Join-Path $root 'infra\env\.env.production'

if (-not (Test-Path $envFile)) { throw 'Missing production environment file.' }
if (-not $Domain) {
  $origin = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^ADMIN_WEB_ORIGIN=' } | Select-Object -First 1
  $Domain = ($origin -replace '^ADMIN_WEB_ORIGIN=', '').TrimEnd('/')
}

$compose = @('compose', '--env-file', $envFile, '-f', $composeFile)
& docker @compose ps
if ($LASTEXITCODE -ne 0) { throw 'Unable to read container status.' }

& curl.exe --fail --silent --show-error "$Domain/api/v1" | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Public API check failed.' }
& curl.exe --fail --silent --show-error "$Domain/" | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Admin web check failed.' }

Write-Host "Production verification passed: $Domain"
