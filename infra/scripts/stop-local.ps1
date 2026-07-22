$ErrorActionPreference = 'Stop'
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$composeFile = Join-Path $projectRoot 'infra\docker\docker-compose.local.yml'

docker compose -f $composeFile down

Write-Host 'Local MySQL and Redis stopped. Data volumes were preserved.'
