param(
  [switch]$Initialize
)

$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$composeFile = Join-Path $root 'infra\docker\docker-compose.production.yml'
$envFile = Join-Path $root 'infra\env\.env.production'
$certFile = Join-Path $root 'infra\certs\fullchain.pem'
$keyFile = Join-Path $root 'infra\certs\privkey.pem'

if (-not (Test-Path $envFile)) {
  throw 'Missing infra/env/.env.production. Copy and edit the example first.'
}
if (-not (Test-Path $certFile) -or -not (Test-Path $keyFile)) {
  throw 'Missing infra/certs/fullchain.pem or privkey.pem.'
}

$envText = Get-Content -LiteralPath $envFile -Raw
if ($envText -match 'replace-with-' -or $envText -match 'https://example\.com') {
  throw 'Production environment still contains placeholder values.'
}

$compose = @('compose', '--env-file', $envFile, '-f', $composeFile)
& docker @compose config --quiet
if ($LASTEXITCODE -ne 0) { throw 'Docker Compose configuration validation failed.' }

if ($Initialize) {
  & docker @compose up -d mysql redis
  if ($LASTEXITCODE -ne 0) { throw 'MySQL or Redis failed to start.' }
  & docker @compose run --rm migrate
  if ($LASTEXITCODE -ne 0) { throw 'Database migration failed.' }
  & docker @compose --profile initialize run --rm seed
  if ($LASTEXITCODE -ne 0) { throw 'Initial seed failed.' }
}

& docker @compose up -d --build
if ($LASTEXITCODE -ne 0) { throw 'Production services failed to start.' }

Write-Host 'Deployment completed. Run infra/scripts/verify-production.ps1.'
