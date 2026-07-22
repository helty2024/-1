$ErrorActionPreference = 'Stop'
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$composeFile = Join-Path $projectRoot 'infra\docker\docker-compose.local.yml'

docker compose -f $composeFile up -d
docker compose -f $composeFile ps

Write-Host ''
Write-Host 'MySQL: 127.0.0.1:3307'
Write-Host 'Redis: 127.0.0.1:6380'
