# Genere le modele semantique Power BI (tables findme_dw)
param(
    [string]$OutputBase = "",
    [string]$ProjectPrefix = "FindMe-BI",
    [string]$SemanticLogicalId = "a8f2e1c4-3b5d-4f9a-8e2c-6d7b9a0f1e3c",
    [string]$ReportLogicalId = "b9e3f2d5-4c6e-5a0b-9f3d-7e8c0b1a2f4d",
    [switch]$SemanticModelOnly
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
if (-not $OutputBase) { $OutputBase = Join-Path $Root "bi\powerbi\_dev-pbip-project" }

$Sm = Join-Path $OutputBase "$ProjectPrefix.SemanticModel"
$Def = Join-Path $Sm "definition"
$TablesDir = Join-Path $Def "tables"
$RpName = "$ProjectPrefix.Report"
$Rp = Join-Path $OutputBase $RpName

$tables = @(
    "dim_date", "dim_user", "dim_user_scd2", "dim_mission", "dim_skill",
    "fact_user", "fact_notification", "fact_mission", "fact_candidature",
    "fact_mission_favori", "fact_cv", "fact_quiz", "fact_codingame", "etl_run_log",
    "v_bi_candidature", "v_bi_mission", "v_bi_kpi_recrutement"
)

function New-Dir($p) {
    if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p -Force | Out-Null }
}

$script:Utf8NoBom = New-Object System.Text.UTF8Encoding $false
function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    [System.IO.File]::WriteAllText($Path, $Content, $script:Utf8NoBom)
}

New-Dir $OutputBase
New-Dir $Sm
New-Dir $Def
New-Dir $TablesDir

@"
{
  "`$schema": "https://developer.microsoft.com/json-schemas/fabric/gitIntegration/platformProperties/2.0.0/schema.json",
  "metadata": { "type": "SemanticModel", "displayName": "$ProjectPrefix" },
  "config": { "version": "2.0", "logicalId": "$SemanticLogicalId" }
}
"@ | ForEach-Object { Write-Utf8NoBom (Join-Path $Sm ".platform") $_ }

@'
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/semanticModel/definitionProperties/1.0.0/schema.json",
  "version": "1.0",
  "settings": { "qnaEnabled": false }
}
'@ | ForEach-Object { Write-Utf8NoBom (Join-Path $Sm "definition.pbism") $_ }

@'
database
    compatibilityLevel: 1550
'@ | ForEach-Object { Write-Utf8NoBom (Join-Path $Def "database.tmdl") $_ }

$refs = ($tables | ForEach-Object { "ref table $_" }) -join "`n"
@"

model Model
    culture: fr-FR
    defaultPowerBIDataSourceVersion: powerBI_V3

    annotation PBI_QueryOrder = ["fn_MySQLTable","PBI_MySqlServer","PBI_MySqlDatabase"]

expression fn_MySQLTable =
		let
		    fn = (tableName as text) =>
		    let
		        Source = MySQL.Database(PBI_MySqlServer, PBI_MySqlDatabase),
		        Data = Source{[Schema=PBI_MySqlDatabase, Item=tableName]}[Data]
		    in
		        Data
		in
		    fn
		meta [IsParameterQuery=false]

expression PBI_MySqlServer = "localhost:3306" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true]
expression PBI_MySqlDatabase = "findme_dw" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true]

$refs

"@ | ForEach-Object { Write-Utf8NoBom (Join-Path $Def "model.tmdl") $_ }

foreach ($t in $tables) {
    $tag = [guid]::NewGuid().ToString()
    @"

table $t
    lineageTag: $tag

    partition $t = m
        mode: import
        source =
            let
                Data = fn_MySQLTable("$t")
            in
                Data

"@ | ForEach-Object { Write-Utf8NoBom (Join-Path $TablesDir "$t.tmdl") $_ }
}

if ($SemanticModelOnly) {
    Write-Host "Modele semantique : $Sm" -ForegroundColor Green
    return
}

New-Dir $Rp
New-Dir (Join-Path $Rp "definition")
New-Dir (Join-Path $Rp "definition\pages")

@'
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/pbip/pbipProperties/1.0.0/schema.json",
  "version": "1.0",
  "artifacts": [
    { "report": { "path": "REPORT_FOLDER" } }
  ],
  "settings": { "enableAutoRecovery": true }
}
'@ -replace 'REPORT_FOLDER', $RpName | ForEach-Object { Write-Utf8NoBom (Join-Path $OutputBase "$ProjectPrefix.pbip") $_ }

@{
  '$schema' = 'https://developer.microsoft.com/json-schemas/fabric/gitIntegration/platformProperties/2.0.0/schema.json'
  metadata = @{ type = 'Report'; displayName = $ProjectPrefix }
  config = @{ version = '2.0'; logicalId = $ReportLogicalId }
} | ConvertTo-Json -Depth 5 | ForEach-Object { Write-Utf8NoBom (Join-Path $Rp '.platform') $_ }

@{
  '$schema' = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json'
  version = '2.0'
  datasetReference = @{ byPath = @{ path = "../$ProjectPrefix.SemanticModel" } }
} | ConvertTo-Json -Depth 5 | ForEach-Object { Write-Utf8NoBom (Join-Path $Rp 'definition.pbir') $_ }

@'
{
  "version": "1.0",
  "config": { "version": "5.0", "themeCollection": { "baseTheme": { "name": "CY24SU10", "type": "SharedResources" } } },
  "layoutOptimization": 0,
  "resourcePackages": [],
  "sections": [{ "name": "ReportSection", "displayName": "Dashboard", "displayOption": 1, "height": 720, "width": 1280, "visualContainers": [] }]
}
'@ | ForEach-Object { Write-Utf8NoBom (Join-Path $Rp 'definition\report.json') $_ }

Write-Host "PBIP genere : $OutputBase\$ProjectPrefix.pbip" -ForegroundColor Green
