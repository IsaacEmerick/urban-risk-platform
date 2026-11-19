# Gera os SVGs dos diagramas para o PDF (texto em vetor), em entrega/imagens/.
# Precisa do Java com o plantuml.jar (extensão PlantUML do VS Code) e do draw.io desktop.
# Uso, na pasta do projeto:  .\entrega\gerar-svg.ps1
$ErrorActionPreference = 'Stop'
$raiz = Split-Path $PSScriptRoot -Parent
$jar = Get-ChildItem "$env:USERPROFILE\.vscode\extensions\jebbs.plantuml-*\plantuml.jar" | Select-Object -Last 1
$drawio = "$env:LOCALAPPDATA\Programs\draw.io\draw.io.exe"
$tmp = Join-Path $env:TEMP 'urp-svg'
New-Item -ItemType Directory -Force $tmp | Out-Null
Copy-Item "$raiz\docs\diagramas\sequencia.puml", "$raiz\docs\diagramas\estados.puml" $tmp
java -jar $jar.FullName -tsvg -charset UTF-8 "$tmp\sequencia.puml" "$tmp\estados.puml"
Copy-Item "$tmp\sequencia.svg", "$tmp\estados.svg" "$PSScriptRoot\imagens\"
& $drawio -x -f svg -o "$PSScriptRoot\imagens\arquitetura.svg" "$raiz\docs\diagramas\arquitetura.drawio"
