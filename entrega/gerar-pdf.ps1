# Gera o PDF da entrega (precisa do Node e do Microsoft Edge instalados).
# Uso, na pasta do projeto:  .\entrega\gerar-pdf.ps1
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
  if (-not (Test-Path 'node_modules')) { npm ci }
  node gerar-pdf.mjs
} finally {
  Pop-Location
}
