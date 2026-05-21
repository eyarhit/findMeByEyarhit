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
    "MesuresBI",
    "dim_date", "dim_user", "dim_user_scd2", "dim_mission", "dim_skill",
    "fact_user", "fact_notification", "fact_mission", "fact_candidature",
    "fact_mission_favori", "fact_cv", "fact_quiz", "fact_codingame", "etl_run_log",
    "v_bi_candidature", "v_bi_mission", "v_bi_kpi_recrutement"
)

# Colonnes TMDL (obligatoires pour que le volet Donnees et les visuels PBIR fonctionnent)
function C([string]$Name, [string]$Type = 'string', [string]$Sum = 'none') {
    [pscustomobject]@{ Name = $Name; Type = $Type; Sum = $Sum }
}

$tableColumns = @{
    MesuresBI = @()
    dim_date = @(
        C 'date_key' 'int64' 'none'
        C 'full_date' 'dateTime' 'none'
        C 'year_num' 'int64' 'none'
        C 'month_num' 'int64' 'none'
        C 'quarter_num' 'int64' 'none'
        C 'month_name' 'string' 'none'
        C 'day_of_week' 'int64' 'none'
        C 'week_of_year' 'int64' 'none'
        C 'is_weekend' 'int64' 'none'
    )
    dim_user = @(
        C 'user_key' 'int64' 'none'
        C 'user_id' 'int64' 'none'
        C 'role_name' 'string' 'none'
        C 'status_name' 'string' 'none'
        C 'country' 'string' 'none'
        C 'sexe' 'string' 'none'
    )
    dim_user_scd2 = @(
        C 'user_scd_key' 'int64' 'none'
        C 'user_id' 'int64' 'none'
        C 'role_name' 'string' 'none'
        C 'status_name' 'string' 'none'
        C 'country' 'string' 'none'
        C 'valid_from' 'dateTime' 'none'
        C 'valid_to' 'dateTime' 'none'
        C 'is_current' 'int64' 'none'
    )
    dim_mission = @(
        C 'mission_key' 'int64' 'none'
        C 'mission_id' 'int64' 'none'
        C 'status_mission' 'string' 'none'
        C 'type_contrat' 'string' 'none'
        C 'is_remote' 'int64' 'none'
        C 'ville' 'string' 'none'
        C 'pays' 'string' 'none'
        C 'mission_name' 'string' 'none'
        C 'reference_code' 'string' 'none'
    )
    dim_skill = @(
        C 'skill_key' 'int64' 'none'
        C 'skill_label' 'string' 'none'
        C 'skill_category' 'string' 'none'
        C 'usage_count' 'int64' 'sum'
    )
    fact_user = @(
        C 'user_key' 'int64' 'none'
        C 'user_count' 'int64' 'sum'
    )
    fact_notification = @(
        C 'notification_key' 'int64' 'none'
        C 'date_key' 'int64' 'none'
        C 'user_id_degen' 'string' 'none'
        C 'is_read' 'int64' 'none'
        C 'notification_count' 'int64' 'sum'
    )
    fact_mission = @(
        C 'mission_key' 'int64' 'none'
        C 'date_key' 'int64' 'none'
        C 'publisher_user_id' 'int64' 'none'
        C 'mission_count' 'int64' 'sum'
    )
    fact_candidature = @(
        C 'candidature_key' 'int64' 'none'
        C 'date_key' 'int64' 'none'
        C 'mission_key' 'int64' 'none'
        C 'candidat_user_id' 'int64' 'none'
        C 'statut_candidature' 'string' 'none'
        C 'candidature_count' 'int64' 'sum'
        C 'is_accepted' 'int64' 'sum'
        C 'is_refused' 'int64' 'sum'
        C 'is_en_cours' 'int64' 'sum'
    )
    fact_mission_favori = @(
        C 'favori_key' 'int64' 'none'
        C 'date_key' 'int64' 'none'
        C 'mission_key' 'int64' 'none'
        C 'user_type' 'string' 'none'
        C 'favori_count' 'int64' 'sum'
    )
    fact_cv = @(
        C 'cv_key' 'int64' 'none'
        C 'date_key' 'int64' 'none'
        C 'user_key' 'int64' 'none'
        C 'cv_count' 'int64' 'sum'
        C 'steps_completed' 'int64' 'sum'
    )
    fact_quiz = @(
        C 'quiz_key' 'int64' 'none'
        C 'date_key' 'int64' 'none'
        C 'user_key' 'int64' 'none'
        C 'score' 'int64' 'sum'
        C 'passed' 'int64' 'none'
        C 'attempt_count' 'int64' 'sum'
    )
    fact_codingame = @(
        C 'codingame_key' 'int64' 'none'
        C 'date_key' 'int64' 'none'
        C 'user_key' 'int64' 'none'
        C 'framework_name' 'string' 'none'
        C 'score' 'double' 'sum'
        C 'total_score' 'double' 'sum'
        C 'session_count' 'int64' 'sum'
    )
    etl_run_log = @(
        C 'run_id' 'int64' 'none'
        C 'started_at' 'dateTime' 'none'
        C 'finished_at' 'dateTime' 'none'
        C 'status' 'string' 'none'
        C 'rows_loaded' 'int64' 'sum'
        C 'error_message' 'string' 'none'
    )
    v_bi_candidature = @(
        C 'full_date' 'dateTime' 'none'
        C 'year_num' 'int64' 'none'
        C 'month_num' 'int64' 'none'
        C 'month_name' 'string' 'none'
        C 'mission_name' 'string' 'none'
        C 'reference_code' 'string' 'none'
        C 'status_mission' 'string' 'none'
        C 'type_contrat' 'string' 'none'
        C 'ville' 'string' 'none'
        C 'pays' 'string' 'none'
        C 'statut_candidature' 'string' 'none'
        C 'candidature_count' 'int64' 'sum'
        C 'is_accepted' 'int64' 'sum'
        C 'is_refused' 'int64' 'sum'
        C 'is_en_cours' 'int64' 'sum'
        C 'candidat_user_id' 'int64' 'none'
    )
    v_bi_mission = @(
        C 'full_date' 'dateTime' 'none'
        C 'year_num' 'int64' 'none'
        C 'month_num' 'int64' 'none'
        C 'mission_name' 'string' 'none'
        C 'status_mission' 'string' 'none'
        C 'type_contrat' 'string' 'none'
        C 'is_remote' 'int64' 'none'
        C 'ville' 'string' 'none'
        C 'pays' 'string' 'none'
        C 'mission_count' 'int64' 'sum'
        C 'publisher_user_id' 'int64' 'none'
    )
    v_bi_kpi_recrutement = @(
        C 'year_num' 'int64' 'none'
        C 'month_num' 'int64' 'none'
        C 'candidatures' 'int64' 'sum'
        C 'acceptees' 'int64' 'sum'
        C 'refusees' 'int64' 'sum'
        C 'taux_acceptation_pct' 'double' 'average'
    )
}

function Format-TmdlColumns([array]$columns) {
    if (-not $columns -or $columns.Count -eq 0) { return '' }
    $lines = New-Object System.Collections.Generic.List[string]
    foreach ($col in $columns) {
        [void]$lines.Add("    column $($col.Name)")
        [void]$lines.Add("        dataType: $($col.Type)")
        [void]$lines.Add("        sourceColumn: $($col.Name)")
        [void]$lines.Add("        summarizeBy: $($col.Sum)")
        [void]$lines.Add('')
    }
    return ($lines -join "`n")
}

# Relations schema en etoile — une seule route active entre dimensions (evite chemins ambigus)
$modelRelationships = @(
    @{ from = 'fact_notification'; fc = 'date_key'; to = 'dim_date'; tc = 'date_key' },
    @{ from = 'fact_mission'; fc = 'mission_key'; to = 'dim_mission'; tc = 'mission_key'; active = $false },
    @{ from = 'fact_mission'; fc = 'date_key'; to = 'dim_date'; tc = 'date_key' },
    @{ from = 'fact_candidature'; fc = 'date_key'; to = 'dim_date'; tc = 'date_key' },
    @{ from = 'fact_candidature'; fc = 'mission_key'; to = 'dim_mission'; tc = 'mission_key' },
    @{ from = 'fact_mission_favori'; fc = 'date_key'; to = 'dim_date'; tc = 'date_key' },
    @{ from = 'fact_mission_favori'; fc = 'mission_key'; to = 'dim_mission'; tc = 'mission_key'; active = $false },
    @{ from = 'fact_cv'; fc = 'date_key'; to = 'dim_date'; tc = 'date_key' },
    @{ from = 'fact_quiz'; fc = 'date_key'; to = 'dim_date'; tc = 'date_key' },
    @{ from = 'fact_codingame'; fc = 'date_key'; to = 'dim_date'; tc = 'date_key' },
    @{ from = 'fact_user'; fc = 'user_key'; to = 'dim_user'; tc = 'user_key' },
    @{ from = 'fact_cv'; fc = 'user_key'; to = 'dim_user'; tc = 'user_key' },
    @{ from = 'fact_quiz'; fc = 'user_key'; to = 'dim_user'; tc = 'user_key'; active = $false },
    @{ from = 'fact_codingame'; fc = 'user_key'; to = 'dim_user'; tc = 'user_key'; active = $false }
    # Pas de lien year_num -> dim_date : year_num n'est pas unique dans dim_date (1 ligne/jour)
)

function Write-ModelRelationships([string]$DefPath) {
    $relLines = New-Object System.Collections.Generic.List[string]
    $relRefs = New-Object System.Collections.Generic.List[string]
    foreach ($r in $modelRelationships) {
        $name = "rel_$($r.from)_$($r.fc)"
        [void]$relRefs.Add("ref relationship $name")
        [void]$relLines.Add("relationship $name")
        [void]$relLines.Add("    fromColumn: $($r.from).$($r.fc)")
        [void]$relLines.Add("    toColumn: $($r.to).$($r.tc)")
        if ($r.active -eq $false) {
            [void]$relLines.Add('    isActive: false')
        }
        [void]$relLines.Add('    crossFilteringBehavior: oneDirection')
        [void]$relLines.Add('')
    }
    Write-Utf8NoBom (Join-Path $DefPath 'relationships.tmdl') ($relLines -join "`n")
    return $relRefs
}

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
  "version": "4.0",
  "settings": { "qnaEnabled": false }
}
'@ | ForEach-Object { Write-Utf8NoBom (Join-Path $Sm "definition.pbism") $_ }

@'
database
    compatibilityLevel: 1550
'@ | ForEach-Object { Write-Utf8NoBom (Join-Path $Def "database.tmdl") $_ }

$dataTables = $tables | Where-Object { $_ -ne 'MesuresBI' }
$queryOrder = (@('PBI_MySqlServer', 'PBI_MySqlDatabase') + $dataTables) | ForEach-Object { "`"$_`"" }
$queryOrderJson = $queryOrder -join ','
$relRefs = Write-ModelRelationships $Def
function Format-TmdlTableRef([string]$tableName) {
    if ($tableName -match '\s') { "ref table '$tableName'" } else { "ref table $tableName" }
}
$tableRefs = ($tables | ForEach-Object { Format-TmdlTableRef $_ }) -join "`n"
$refs = ($tableRefs, ($relRefs -join "`n")) -join "`n`n"
@"

model Model
    culture: fr-FR
    defaultPowerBIDataSourceVersion: powerBI_V3

    annotation PBI_QueryOrder = [$queryOrderJson]

expression PBI_MySqlServer = "localhost:3306" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true]
expression PBI_MySqlDatabase = "findme_dw" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true]

$refs

"@ | ForEach-Object { Write-Utf8NoBom (Join-Path $Def "model.tmdl") $_ }

$measuresTmdl = @'
table MesuresBI
    lineageTag: a1b2c3d4-e5f6-7890-abcd-ef1234567890

    column Dummy
        dataType: int64
        sourceColumn: Dummy
        summarizeBy: none

    measure 'KPI Candidatures' = SUM(v_bi_kpi_recrutement[candidatures])
    measure 'KPI Acceptees' = SUM(v_bi_kpi_recrutement[acceptees])
    measure 'KPI Refusees' = SUM(v_bi_kpi_recrutement[refusees])
    measure 'KPI Taux %' = DIVIDE([KPI Acceptees], [KPI Candidatures], 0) * 100
    measure 'Missions (vue)' = SUM(v_bi_mission[mission_count])
    measure 'Missions ouvertes' =
        CALCULATE([Missions (vue)], v_bi_mission[status_mission] = "OPEN")
    measure 'Missions remote' =
        CALCULATE([Missions (vue)], v_bi_mission[is_remote] = 1)
    measure 'Candidatures (vue)' = SUM(v_bi_candidature[candidature_count])
    measure 'Acceptees (vue)' = SUM(v_bi_candidature[is_accepted])
    measure 'Refusees (vue)' = SUM(v_bi_candidature[is_refused])
    measure 'En cours (vue)' = SUM(v_bi_candidature[is_en_cours])
    measure 'Taux % (vue)' = DIVIDE([Acceptees (vue)], [Candidatures (vue)], 0) * 100
    measure 'Total utilisateurs' = SUM(fact_user[user_count])
    measure 'Total notifications' = SUM(fact_notification[notification_count])
    measure 'Notifications lues' =
        CALCULATE([Total notifications], fact_notification[is_read] = 1)
    measure 'Taux lecture %' = DIVIDE([Notifications lues], [Total notifications], 0) * 100
    measure 'Total CV' = SUM(fact_cv[cv_count])
    measure 'Etapes moyennes' = AVERAGE(fact_cv[steps_completed])
    measure 'Total usages' = SUM(dim_skill[usage_count])
    measure 'Total favoris' = SUM(fact_mission_favori[favori_count])
    measure 'Tentatives quiz' = SUM(fact_quiz[attempt_count])
    measure 'Score moyen quiz' = AVERAGE(fact_quiz[score])
    measure 'Taux reussite quiz %' =
        DIVIDE(CALCULATE([Tentatives quiz], fact_quiz[passed] = 1), [Tentatives quiz], 0) * 100
    measure 'Sessions codingame' = SUM(fact_codingame[session_count])
    measure 'Score moyen CDG' = AVERAGE(fact_codingame[score])
    measure 'Score CDG %' =
        DIVIDE(AVERAGE(fact_codingame[score]), AVERAGE(fact_codingame[total_score]), 0) * 100
    measure 'Dernier refresh OK' =
        CALCULATE(MAX(etl_run_log[finished_at]), etl_run_log[status] = "OK")

    partition MesuresBI = m
        mode: import
        source =
            let
                Source = #table(type table [Dummy = Int64.Type], {{1}})
            in
                Source

'@

Remove-Item (Join-Path $TablesDir '_Mesures BI.tmdl') -Force -ErrorAction SilentlyContinue

foreach ($t in $tables) {
    if ($t -eq 'MesuresBI') {
        Write-Utf8NoBom (Join-Path $TablesDir 'MesuresBI.tmdl') $measuresTmdl
        continue
    }
    $tag = [guid]::NewGuid().ToString()
    $colBlock = Format-TmdlColumns $tableColumns[$t]
    @"

table $t
    lineageTag: $tag

$colBlock
    partition $t = m
        mode: import
        source =
            let
                Source = MySQL.Database(PBI_MySqlServer, PBI_MySqlDatabase),
                Data = try Source{[Schema=PBI_MySqlDatabase, Item="$t"]}[Data]
                    otherwise try Source{[Name="$t", Kind="Table"]}[Data]
                    otherwise try Source{[Item="$t"]}[Data]
                    otherwise Value.NativeQuery(Source, "SELECT * FROM $t", null)
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
  "resourcePackages": [],
  "sections": [{ "name": "ReportSection", "displayName": "Dashboard", "displayOption": 1, "height": 720, "width": 1280, "visualContainers": [] }]
}
'@ | ForEach-Object { Write-Utf8NoBom (Join-Path $Rp 'definition\report.json') $_ }

Write-Host "PBIP genere : $OutputBase\$ProjectPrefix.pbip" -ForegroundColor Green
