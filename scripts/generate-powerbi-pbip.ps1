# Genere le projet Power BI Desktop (PBIP) - toutes les tables findme_dw
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Base = Join-Path $Root "bi\powerbi\FindMe-BI"
$Sm = Join-Path $Base "FindMe-BI.SemanticModel"
$Def = Join-Path $Sm "definition"
$TablesDir = Join-Path $Def "tables"

$tables = @(
    "dim_date", "dim_user", "dim_user_scd2", "dim_mission", "dim_skill",
    "fact_user", "fact_notification", "fact_mission", "fact_candidature",
    "fact_mission_favori", "fact_cv", "fact_quiz", "fact_codingame", "etl_run_log",
    "v_bi_candidature", "v_bi_mission", "v_bi_kpi_recrutement"
)

function New-Dir($p) {
    if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p -Force | Out-Null }
}

New-Dir $Base
New-Dir $Sm
New-Dir $Def
New-Dir $TablesDir
New-Dir (Join-Path $Base "FindMe-BI.Report")
New-Dir (Join-Path $Base "FindMe-BI.Report\definition")
New-Dir (Join-Path $Base "FindMe-BI.Report\definition\pages")

@'
{
  "version": "1.0",
  "artifacts": [
    { "report": { "path": "FindMe-BI.Report" } },
    { "dataset": { "path": "FindMe-BI.SemanticModel" } }
  ],
  "settings": { "enableAutoRecovery": true }
}
'@ | Set-Content -Path (Join-Path $Base "FindMe-BI.pbip") -Encoding UTF8

@'
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/gitIntegration/platformProperties/2.0.0/schema.json",
  "metadata": { "type": "SemanticModel", "displayName": "FindMe-BI" },
  "config": { "version": "2.0", "logicalId": "findme-bi-semantic-001" }
}
'@ | Set-Content -Path (Join-Path $Sm ".platform") -Encoding UTF8

@'
{
  "version": "4.0",
  "settings": { "qnaEnabled": false }
}
'@ | Set-Content -Path (Join-Path $Sm "definition.pbism") -Encoding UTF8

@'
database
    compatibilityLevel: 1550
'@ | Set-Content -Path (Join-Path $Def "database.tmdl") -Encoding UTF8

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

"@ | Set-Content -Path (Join-Path $Def "model.tmdl") -Encoding UTF8

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

"@ | Set-Content -Path (Join-Path $TablesDir "$t.tmdl") -Encoding UTF8
}

@'
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/gitIntegration/platformProperties/2.0.0/schema.json",
  "metadata": { "type": "Report", "displayName": "FindMe-BI" },
  "config": { "version": "2.0", "logicalId": "findme-bi-report-001" }
}
'@ | Set-Content -Path (Join-Path $Base "FindMe-BI.Report\.platform") -Encoding UTF8

@'
{
  "version": "4.0",
  "datasetReference": {
    "byPath": { "path": "../FindMe-BI.SemanticModel" }
  }
}
'@ | Set-Content -Path (Join-Path $Base "FindMe-BI.Report\definition.pbir") -Encoding UTF8

@'
{
  "version": "1.0",
  "config": { "version": "5.0", "themeCollection": { "baseTheme": { "name": "CY24SU10", "type": "SharedResources" } } },
  "layoutOptimization": 0,
  "resourcePackages": [],
  "sections": [
    {
      "name": "ReportSection",
      "displayName": "Dashboard Find-Me",
      "displayOption": 1,
      "height": 720,
      "width": 1280,
      "visualContainers": []
    }
  ]
}
'@ | Set-Content -Path (Join-Path $Base "FindMe-BI.Report\definition\report.json") -Encoding UTF8

Write-Host "PBIP genere : $Base\FindMe-BI.pbip" -ForegroundColor Green
