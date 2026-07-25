$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$localCompose = Join-Path $root 'infra\docker\docker-compose.local.yml'
$productionCompose = Join-Path $root 'infra\docker\docker-compose.production.yml'
$productionExample = Join-Path $root 'infra\env\.env.production.example'
$testAdminCreated = $false

function Run-Npm([string]$Directory, [string[]]$Arguments) {
  Push-Location (Join-Path $root $Directory)
  try {
    & npm @Arguments
    if ($LASTEXITCODE -ne 0) { throw "npm failed in ${Directory}: $($Arguments -join ' ')" }
  } finally {
    Pop-Location
  }
}

try {
  & docker compose -f $localCompose up -d --wait --wait-timeout 120
  if ($LASTEXITCODE -ne 0) { throw 'Local MySQL/Redis startup failed.' }

  Run-Npm '.' @('test')
  Run-Npm 'packages\contracts' @('run', 'build')
  Run-Npm 'api-server' @('run', 'prisma:generate')
  Run-Npm 'api-server' @('run', 'build')
  Run-Npm 'api-server' @('test', '--', '--runInBand')
  Run-Npm 'api-server' @('run', 'test:e2e', '--', '--runInBand')
  Run-Npm 'admin-web' @('run', 'build')

  Run-Npm 'api-server' @('run', 'test:admin:create')
  $testAdminCreated = $true
  Run-Npm 'admin-web' @('run', 'test:e2e:install')
  Run-Npm 'admin-web' @('run', 'test:e2e')

  $env:APP_ENV_FILE = '../env/.env.production.example'
  & docker compose --env-file $productionExample -f $productionCompose config --quiet
  if ($LASTEXITCODE -ne 0) { throw 'Production Compose validation failed.' }
  Remove-Item Env:APP_ENV_FILE -ErrorAction SilentlyContinue

  Write-Host 'All automated tests passed.'
} finally {
  Remove-Item Env:APP_ENV_FILE -ErrorAction SilentlyContinue
  if ($testAdminCreated) {
    try { Run-Npm 'api-server' @('run', 'test:admin:delete') } catch { Write-Warning $_ }
  }
}
