param(
  [string]$Version = "1.0.0-$(Get-Date -Format 'yyyyMMdd-HHmm')"
)

$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$releaseRoot = Join-Path $root 'release'
$stageRoot = Join-Path $releaseRoot ".staging-$Version"
$packageRoot = Join-Path $stageRoot "zhishentang-deployment-$Version"
$zipPath = Join-Path $releaseRoot "zhishentang-deployment-$Version.zip"
$hashPath = "$zipPath.sha256"

New-Item -ItemType Directory -Force -Path $releaseRoot | Out-Null
$resolvedRelease = [System.IO.Path]::GetFullPath($releaseRoot)
$resolvedStage = [System.IO.Path]::GetFullPath($stageRoot)
if (-not $resolvedStage.StartsWith($resolvedRelease, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'Staging directory must stay inside release.'
}

if (Test-Path $stageRoot) { Remove-Item -LiteralPath $stageRoot -Recurse -Force }
if (Test-Path $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
if (Test-Path $hashPath) { Remove-Item -LiteralPath $hashPath -Force }
New-Item -ItemType Directory -Force -Path $packageRoot | Out-Null

function Copy-Tree([string]$Source, [string]$Destination) {
  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
  & robocopy $Source $Destination /E /NFL /NDL /NJH /NJS /NP /XD node_modules dist storage /XF .env .env.production '*.log' '*.pem' '*.key' | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "Failed to copy directory: $Source" }
}

Copy-Tree (Join-Path $root 'api-server') (Join-Path $packageRoot 'api-server')
Copy-Tree (Join-Path $root 'admin-web') (Join-Path $packageRoot 'admin-web')
Copy-Tree (Join-Path $root 'infra') (Join-Path $packageRoot 'infra')
Copy-Tree (Join-Path $root 'docs\deployment') (Join-Path $packageRoot 'docs\deployment')

New-Item -ItemType Directory -Force -Path (Join-Path $packageRoot 'data') | Out-Null
Copy-Item (Join-Path $root 'data\officialContent.js') (Join-Path $packageRoot 'data\officialContent.js')
Copy-Item (Join-Path $root 'data\officialProducts.js') (Join-Path $packageRoot 'data\officialProducts.js')
New-Item -ItemType Directory -Force -Path (Join-Path $packageRoot 'pages\official\data') | Out-Null
Copy-Item (Join-Path $root 'pages\official\data\products.js') (Join-Path $packageRoot 'pages\official\data\products.js')
New-Item -ItemType Directory -Force -Path (Join-Path $packageRoot 'config') | Out-Null
Copy-Item (Join-Path $root 'config\officialApi.production.example.js') (Join-Path $packageRoot 'config\officialApi.production.example.js')
Copy-Item (Join-Path $root '.dockerignore') (Join-Path $packageRoot '.dockerignore')

$manifest = @"
Zhongkang Shenzhi V1 production deployment package
Version: $Version
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')

Read docs/deployment/PRODUCTION_DEPLOYMENT.md before deployment.
This package excludes production secrets, TLS private keys, node_modules, build outputs, and database data.
"@
Set-Content -LiteralPath (Join-Path $packageRoot 'README_DEPLOYMENT.txt') -Value $manifest -Encoding utf8

Compress-Archive -Path $packageRoot -DestinationPath $zipPath -CompressionLevel Optimal
$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $zipPath).Hash.ToLowerInvariant()
Set-Content -LiteralPath $hashPath -Value "$hash  $(Split-Path $zipPath -Leaf)" -Encoding ascii
Remove-Item -LiteralPath $stageRoot -Recurse -Force

Write-Host "Package: $zipPath"
Write-Host "Checksum: $hashPath"
