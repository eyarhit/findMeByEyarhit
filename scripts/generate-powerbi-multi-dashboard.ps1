# Genere PBIP 4 pages — spec findme_powerbi_dashboard_guide + findme_4dashboards_full_layout
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Base = Join-Path $Root "bi\powerbi\FindMe-Dashboard"
$SmName = "FindMe-Dashboard.SemanticModel"
$RpName = "FindMe-Dashboard.Report"
$Rp = Join-Path $Base $RpName
$PagesDir = Join-Path $Rp "definition\pages"
$M = 'MesuresBI'

$script:HdrY = 8;    $script:HdrH = 48
$script:NavX = 520;  $script:NavW = 736; $script:NavH = 44
$script:KpiY = 60;   $script:KpiH = 72
$script:FiltY = 140; $script:FiltH = 44
$script:MidY = 192;  $script:MidH = 200
$script:BotY = 400;  $script:BotH = 308

$script:Utf8NoBom = New-Object System.Text.UTF8Encoding $false
function Write-Utf8NoBom([string]$Path, [string]$Content) {
    $dir = Split-Path $Path -Parent
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($Path, $Content, $script:Utf8NoBom)
}
function New-Dir($p) { if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p -Force | Out-Null } }

function Get-VisualContainerObjects {
    $off = @{ show = @{ expr = @{ Literal = @{ Value = 'false' } } } }
    @{
        background = @(@{ properties = $off })
        border     = @(@{ properties = $off })
        dropShadow = @(@{ properties = $off })
        title      = @(@{ properties = $off })
    }
}

function New-ColumnProjection($entity, $property, [bool]$active = $false) {
    @{
        field = @{ Column = @{ Expression = @{ SourceRef = @{ Entity = $entity } }; Property = $property } }
        queryRef = "$entity.$property"
        active = $active
    }
}
function New-MeasureProjection($entity, $property) {
    @{
        field = @{ Measure = @{ Expression = @{ SourceRef = @{ Entity = $entity } }; Property = $property } }
        queryRef = "$entity.$property"
    }
}
function New-SumProjection($entity, $property) {
    @{
        field = @{ Aggregation = @{ Expression = @{ Column = @{ Expression = @{ SourceRef = @{ Entity = $entity } }; Property = $property } }; Function = 0 } }
        queryRef = "Sum($entity.$property)"
    }
}
function New-AvgProjection($entity, $property) {
    @{
        field = @{ Aggregation = @{ Expression = @{ Column = @{ Expression = @{ SourceRef = @{ Entity = $entity } }; Property = $property } }; Function = 1 } }
        queryRef = "Avg($entity.$property)"
    }
}

function New-VisualPro($id, $x, $y, $w, $h, $z, $tabOrder, $visualType, $queryState, $objects) {
    $v = @{
        '$schema' = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.7.0/schema.json'
        name = $id
        position = @{ x = $x; y = $y; z = $z; width = $w; height = $h; tabOrder = $tabOrder }
        visual = @{
            visualType = $visualType
            objects = $objects
            visualContainerObjects = (Get-VisualContainerObjects)
        }
    }
    if ($queryState) { $v.visual.query = @{ queryState = $queryState } }
    $v | ConvertTo-Json -Depth 40 -Compress:$false
}

function Write-Vis($page, $id, $x, $y, $w, $h, $z, $to, $type, $query, $objects = @{}) {
    $dir = Join-Path $PagesDir "$page\visuals\$id"
    New-Dir $dir
    Write-Utf8NoBom (Join-Path $dir 'visual.json') (New-VisualPro $id $x $y $w $h $z $to $type $query $objects)
}

function New-PageJson($id, $displayName) {
    $dn = $displayName.Replace('\', '\\').Replace('"', '\"')
    @"
{
  "`$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.1.0/schema.json",
  "name": "$id",
  "displayName": "$dn",
  "displayOption": "FitToPage",
  "height": 720,
  "width": 1280
}
"@
}

function Get-KpiLayout([int]$count) {
    $margin = 24; $gap = 8
    $w = [int][math]::Floor((1280 - 2 * $margin - ($count - 1) * $gap) / $count)
    $xs = 0..($count - 1) | ForEach-Object { $margin + $_ * ($w + $gap) }
    @{ Width = $w; X = $xs }
}

function Write-KpiRow($page, $items, $y, $h) {
    $layout = Get-KpiLayout $items.Count
    for ($i = 0; $i -lt $items.Count; $i++) {
        $it = $items[$i]
        $proj = if ($it.Measure) { New-MeasureProjection $M $it.Measure } else { New-SumProjection $it.Entity $it.Column }
        Write-Vis $page $it.Id $layout.X[$i] $y $layout.Width $h (2000 + $i) (1000 + $i) 'card' @{
            Values = @{ projections = @($proj) }
        }
    }
}

function Add-PageChrome($page, $dashTitle, $pageSubtitle) {
    Write-Vis $page 'header_main' 24 $script:HdrY 480 $script:HdrH 10000 0 'textbox' $null @{
        general = @(@{
            properties = @{
                paragraphs = @(
                    @{ textRuns = @(@{ value = $dashTitle; textStyle = @{ fontSize = '18pt'; fontWeight = 'bold'; color = '#1B3A57' } }) },
                    @{ textRuns = @(@{ value = $pageSubtitle; textStyle = @{ fontSize = '10pt'; color = '#5A6B7D' } }) }
                )
            }
        })
    }
}

function Write-Slicer($page, $id, $x, $entity, $col, $z, $to) {
    Write-Vis $page $id $x $script:FiltY 200 $script:FiltH $z $to 'slicer' @{
        Values = @{ projections = @(New-ColumnProjection $entity $col $true) }
    }
}

# --- Modele semantique (tables + mesures DAX + relations) ---
$SemanticLogicalId = '2e8b4f1a-6c3d-4b9e-a1f0-3c7d9e2b4f6a'
$ReportLogicalId     = '7f3a9c2e-4b1d-4e8a-9f2c-1d5e6a7b8c9d'
& (Join-Path $PSScriptRoot 'generate-powerbi-pbip.ps1') -OutputBase $Base -ProjectPrefix 'FindMe-Dashboard' -SemanticModelOnly -SemanticLogicalId $SemanticLogicalId

$pageExec = 'page_exec_findme01'
$pageMgr  = 'page_mgr_findme02'
$pageOps  = 'page_ops_findme03'
$pageTech = 'page_tech_findme04'

if (Test-Path $PagesDir) { Remove-Item $PagesDir -Recurse -Force }
New-Dir $PagesDir

foreach ($p in @($pageExec, $pageMgr, $pageOps, $pageTech)) {
    New-Dir (Join-Path $PagesDir $p)
    New-Dir (Join-Path $PagesDir "$p\visuals")
}

$pagesMeta = @{
    '$schema' = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/pagesMetadata/1.0.0/schema.json'
    pageOrder = @($pageExec, $pageMgr, $pageOps, $pageTech)
    activePageName = $pageExec
} | ConvertTo-Json -Depth 10 -Compress:$false
Write-Utf8NoBom (Join-Path $PagesDir 'pages.json') $pagesMeta

Write-Utf8NoBom (Join-Path $PagesDir "$pageExec\page.json") (New-PageJson $pageExec '01 - Executive')
Write-Utf8NoBom (Join-Path $PagesDir "$pageMgr\page.json")  (New-PageJson $pageMgr  '02 - Managerial')
Write-Utf8NoBom (Join-Path $PagesDir "$pageOps\page.json")  (New-PageJson $pageOps  '03 - Operationnel')
Write-Utf8NoBom (Join-Path $PagesDir "$pageTech\page.json") (New-PageJson $pageTech '04 - Technique')

$sub = 'Find-Me · findme_dw · Talend ETL · Guide 4 dashboards'

# ========== 01 Executive ==========
Add-PageChrome $pageExec '01 — Executive dashboard' $sub
Write-KpiRow $pageExec @(
    @{ Id = 'kpi_cand'; Measure = 'KPI Candidatures' },
    @{ Id = 'kpi_acc'; Measure = 'KPI Acceptees' },
    @{ Id = 'kpi_tx'; Measure = 'KPI Taux %' },
    @{ Id = 'kpi_mis'; Measure = 'Missions (vue)' },
    @{ Id = 'kpi_open'; Measure = 'Missions ouvertes' }
) $script:KpiY $script:KpiH

Write-Slicer $pageExec 'slicer_year' 24 'v_bi_kpi_recrutement' 'year_num' 3000 5000
Write-Slicer $pageExec 'slicer_contrat' 232 'v_bi_mission' 'type_contrat' 3001 5100
Write-Slicer $pageExec 'slicer_date' 440 'dim_date' 'full_date' 3002 5200

Write-Vis $pageExec 'line_cand' 24 $script:MidY 400 $script:MidH 1001 3000 'lineChart' @{
    Category = @{ projections = @(New-ColumnProjection 'v_bi_kpi_recrutement' 'month_num' $true) }
    Y        = @{ projections = @(New-MeasureProjection $M 'KPI Candidatures') }
}
Write-Vis $pageExec 'col_acc_ref' 436 $script:MidY 400 $script:MidH 1002 3100 'clusteredColumnChart' @{
    Category = @{ projections = @(New-ColumnProjection 'v_bi_kpi_recrutement' 'month_num' $true) }
    Y        = @{ projections = @(
        (New-SumProjection 'v_bi_kpi_recrutement' 'acceptees'),
        (New-SumProjection 'v_bi_kpi_recrutement' 'refusees')
    ) }
}
Write-Vis $pageExec 'line_taux' 848 $script:MidY 408 $script:MidH 1003 3200 'lineChart' @{
    Category = @{ projections = @(New-ColumnProjection 'v_bi_kpi_recrutement' 'month_num' $true) }
    Y        = @{ projections = @(New-AvgProjection 'v_bi_kpi_recrutement' 'taux_acceptation_pct') }
}

Write-Vis $pageExec 'bar_top_mission' 24 $script:BotY 1232 $script:BotH 1004 4000 'clusteredBarChart' @{
    Category = @{ projections = @(New-ColumnProjection 'v_bi_candidature' 'mission_name' $true) }
    Y        = @{ projections = @(New-SumProjection 'v_bi_candidature' 'candidature_count') }
}

# ========== 02 Managerial ==========
Add-PageChrome $pageMgr '02 — Managerial dashboard' $sub
Write-KpiRow $pageMgr @(
    @{ Id = 'kpi_cv'; Measure = 'Candidatures (vue)' },
    @{ Id = 'kpi_acc'; Measure = 'Acceptees (vue)' },
    @{ Id = 'kpi_ref'; Measure = 'Refusees (vue)' },
    @{ Id = 'kpi_enc'; Measure = 'En cours (vue)' },
    @{ Id = 'kpi_mis'; Measure = 'Missions (vue)' }
) $script:KpiY $script:KpiH

Write-Slicer $pageMgr 'slicer_year' 24 'v_bi_candidature' 'year_num' 3000 5000
Write-Slicer $pageMgr 'slicer_ville' 232 'v_bi_mission' 'ville' 3001 5100
Write-Slicer $pageMgr 'slicer_contrat' 440 'v_bi_mission' 'type_contrat' 3002 5200
Write-Slicer $pageMgr 'slicer_statut' 648 'v_bi_candidature' 'statut_candidature' 3003 5300
Write-Slicer $pageMgr 'slicer_remote' 856 'v_bi_mission' 'is_remote' 3004 5400

Write-Vis $pageMgr 'donut_statut' 24 $script:MidY 300 $script:MidH 1001 3000 'donutChart' @{
    Category = @{ projections = @(New-ColumnProjection 'v_bi_candidature' 'statut_candidature' $true) }
    Y        = @{ projections = @(New-MeasureProjection $M 'Candidatures (vue)') }
}
Write-Vis $pageMgr 'bar_contrat' 336 $script:MidY 300 $script:MidH 1002 3100 'clusteredColumnChart' @{
    Category = @{ projections = @(New-ColumnProjection 'v_bi_mission' 'type_contrat' $true) }
    Y        = @{ projections = @(New-MeasureProjection $M 'Missions (vue)') }
}
Write-Vis $pageMgr 'line_month' 648 $script:MidY 300 $script:MidH 1003 3200 'lineChart' @{
    Category = @{ projections = @(New-ColumnProjection 'v_bi_candidature' 'month_name' $true) }
    Y        = @{ projections = @(New-MeasureProjection $M 'Candidatures (vue)') }
}
Write-Vis $pageMgr 'bar_ville' 960 $script:MidY 304 $script:MidH 1004 3300 'clusteredBarChart' @{
    Category = @{ projections = @(New-ColumnProjection 'v_bi_mission' 'ville' $true) }
    Y        = @{ projections = @(New-MeasureProjection $M 'Missions (vue)') }
}

Write-Vis $pageMgr 'tbl_detail' 24 $script:BotY 620 $script:BotH 1005 4000 'tableEx' @{
    Values = @{
        projections = @(
            (New-ColumnProjection 'v_bi_candidature' 'mission_name' $true),
            (New-ColumnProjection 'v_bi_candidature' 'reference_code'),
            (New-ColumnProjection 'v_bi_candidature' 'type_contrat'),
            (New-ColumnProjection 'v_bi_candidature' 'status_mission'),
            (New-ColumnProjection 'v_bi_candidature' 'ville'),
            (New-ColumnProjection 'v_bi_candidature' 'candidature_count')
        )
    }
}
Write-Vis $pageMgr 'bar_ville_stack' 656 $script:BotY 600 $script:BotH 1006 4100 'clusteredColumnChart' @{
    Category = @{ projections = @(New-ColumnProjection 'v_bi_candidature' 'ville' $true) }
    Y        = @{ projections = @(
        (New-SumProjection 'v_bi_candidature' 'is_accepted'),
        (New-SumProjection 'v_bi_candidature' 'is_refused')
    ) }
}

# ========== 03 Operationnel ==========
Add-PageChrome $pageOps '03 — Dashboard operationnel' $sub
Write-KpiRow $pageOps @(
    @{ Id = 'kpi_u'; Measure = 'Total utilisateurs' },
    @{ Id = 'kpi_n'; Measure = 'Total notifications' },
    @{ Id = 'kpi_nl'; Measure = 'Notifications lues' },
    @{ Id = 'kpi_nt'; Measure = 'Taux lecture %' },
    @{ Id = 'kpi_cv'; Measure = 'Total CV' },
    @{ Id = 'kpi_st'; Measure = 'Etapes moyennes' },
    @{ Id = 'kpi_fav'; Measure = 'Total favoris' }
) $script:KpiY $script:KpiH

Write-Slicer $pageOps 'slicer_date' 24 'dim_date' 'full_date' 3000 5000
Write-Slicer $pageOps 'slicer_role' 232 'dim_user' 'role_name' 3001 5100
Write-Slicer $pageOps 'slicer_pays' 440 'dim_user' 'country' 3002 5200
Write-Slicer $pageOps 'slicer_skillcat' 648 'dim_skill' 'skill_category' 3003 5300

Write-Vis $pageOps 'bar_skills' 24 $script:MidY 400 $script:MidH 1001 3000 'clusteredBarChart' @{
    Category = @{ projections = @(New-ColumnProjection 'dim_skill' 'skill_label' $true) }
    Y        = @{ projections = @(New-MeasureProjection $M 'Total usages') }
}
Write-Vis $pageOps 'donut_role' 436 $script:MidY 400 $script:MidH 1002 3100 'donutChart' @{
    Category = @{ projections = @(New-ColumnProjection 'dim_user' 'role_name' $true) }
    Y        = @{ projections = @(New-MeasureProjection $M 'Total utilisateurs') }
}
Write-Vis $pageOps 'line_activity' 848 $script:MidY 408 $script:MidH 1003 3200 'lineChart' @{
    Category = @{ projections = @(New-ColumnProjection 'dim_date' 'full_date' $true) }
    Y        = @{ projections = @(
        (New-SumProjection 'fact_cv' 'cv_count'),
        (New-SumProjection 'fact_notification' 'notification_count')
    ) }
}

Write-Vis $pageOps 'bar_steps' 24 $script:BotY 400 $script:BotH 1004 4000 'clusteredColumnChart' @{
    Category = @{ projections = @(New-ColumnProjection 'fact_cv' 'steps_completed' $true) }
    Y        = @{ projections = @(New-SumProjection 'fact_cv' 'cv_count') }
}
Write-Vis $pageOps 'donut_skillcat' 436 $script:BotY 400 $script:BotH 1005 4100 'donutChart' @{
    Category = @{ projections = @(New-ColumnProjection 'dim_skill' 'skill_category' $true) }
    Y        = @{ projections = @(New-MeasureProjection $M 'Total usages') }
}
Write-Vis $pageOps 'line_notif' 848 $script:BotY 408 $script:BotH 1006 4200 'lineChart' @{
    Category = @{ projections = @(New-ColumnProjection 'dim_date' 'full_date' $true) }
    Y        = @{ projections = @(
        (New-MeasureProjection $M 'Total notifications'),
        (New-MeasureProjection $M 'Notifications lues')
    ) }
}

# ========== 04 Technique ==========
Add-PageChrome $pageTech '04 — Dashboard technique' $sub
Write-KpiRow $pageTech @(
    @{ Id = 'kpi_qz'; Measure = 'Tentatives quiz' },
    @{ Id = 'kpi_qs'; Measure = 'Score moyen quiz' },
    @{ Id = 'kpi_qt'; Measure = 'Taux reussite quiz %' },
    @{ Id = 'kpi_cg'; Measure = 'Sessions codingame' },
    @{ Id = 'kpi_cs'; Measure = 'Score moyen CDG' },
    @{ Id = 'kpi_etl'; Measure = 'Dernier refresh OK' }
) $script:KpiY $script:KpiH

Write-Slicer $pageTech 'slicer_date' 24 'dim_date' 'full_date' 3000 5000
Write-Slicer $pageTech 'slicer_fw' 232 'fact_codingame' 'framework_name' 3001 5100
Write-Slicer $pageTech 'slicer_passed' 440 'fact_quiz' 'passed' 3002 5200
Write-Slicer $pageTech 'slicer_etl' 648 'etl_run_log' 'status' 3003 5300

Write-Vis $pageTech 'bar_fw' 24 $script:MidY 400 $script:MidH 1001 3000 'clusteredBarChart' @{
    Category = @{ projections = @(New-ColumnProjection 'fact_codingame' 'framework_name' $true) }
    Y        = @{ projections = @(New-MeasureProjection $M 'Score moyen CDG') }
}
Write-Vis $pageTech 'line_quiz' 436 $script:MidY 400 $script:MidH 1002 3100 'lineChart' @{
    Category = @{ projections = @(New-ColumnProjection 'dim_date' 'full_date' $true) }
    Y        = @{ projections = @(New-MeasureProjection $M 'Score moyen quiz') }
}
Write-Vis $pageTech 'donut_passed' 848 $script:MidY 408 $script:MidH 1003 3200 'donutChart' @{
    Category = @{ projections = @(New-ColumnProjection 'fact_quiz' 'passed' $true) }
    Y        = @{ projections = @(New-MeasureProjection $M 'Tentatives quiz') }
}

Write-Vis $pageTech 'bar_user_quiz' 24 $script:BotY 400 $script:BotH 1004 4000 'clusteredColumnChart' @{
    Category = @{ projections = @(New-ColumnProjection 'fact_quiz' 'user_key' $true) }
    Y        = @{ projections = @(New-SumProjection 'fact_quiz' 'attempt_count') }
}
Write-Vis $pageTech 'tbl_etl' 436 $script:BotY 400 $script:BotH 1005 4100 'tableEx' @{
    Values = @{
        projections = @(
            (New-ColumnProjection 'etl_run_log' 'started_at' $true),
            (New-ColumnProjection 'etl_run_log' 'finished_at'),
            (New-ColumnProjection 'etl_run_log' 'status'),
            (New-ColumnProjection 'etl_run_log' 'rows_loaded'),
            (New-ColumnProjection 'etl_run_log' 'error_message')
        )
    }
}
Write-Vis $pageTech 'line_cdg_month' 848 $script:BotY 408 $script:BotH 1006 4200 'lineChart' @{
    Category = @{ projections = @(New-ColumnProjection 'dim_date' 'month_name' $true) }
    Y        = @{ projections = @(New-MeasureProjection $M 'Sessions codingame') }
}

# report.json
$reportJson = @'
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/report/3.2.0/schema.json",
  "themeCollection": {
    "baseTheme": {
      "name": "CY24SU10",
      "reportVersionAtImport": { "visual": "2.6.0", "report": "3.1.0", "page": "2.3.0" },
      "type": "SharedResources"
    }
  },
  "resourcePackages": [
    {
      "name": "SharedResources",
      "type": "SharedResources",
      "items": [{ "name": "CY24SU10", "path": "BaseThemes/CY24SU10.json", "type": "BaseTheme" }]
    }
  ],
  "settings": {
    "useStylableVisualContainerHeader": true,
    "defaultDrillFilterOtherVisuals": true,
    "allowChangeFilterTypes": true,
    "useEnhancedTooltips": true,
    "pagesPosition": "Bottom",
    "filterPaneHiddenInEditMode": true
  }
}
'@
Write-Utf8NoBom (Join-Path $Rp 'definition\report.json') $reportJson

Write-Utf8NoBom (Join-Path $Rp 'definition\version.json') @'
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/versionMetadata/1.0.0/schema.json",
  "version": "2.0.0"
}
'@

Write-Utf8NoBom (Join-Path $Rp 'definition.pbir') @"
{
  "`$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json",
  "version": "4.0",
  "datasetReference": { "byPath": { "path": "../$SmName" } }
}
"@

Write-Utf8NoBom (Join-Path $Rp '.platform') @"
{
  "`$schema": "https://developer.microsoft.com/json-schemas/fabric/gitIntegration/platformProperties/2.0.0/schema.json",
  "metadata": { "type": "Report", "displayName": "FindMe-Dashboard" },
  "config": { "version": "2.0", "logicalId": "$ReportLogicalId" }
}
"@

Write-Utf8NoBom (Join-Path $Base 'FindMe-Dashboard.pbip') @"
{
  "`$schema": "https://developer.microsoft.com/json-schemas/fabric/pbip/pbipProperties/1.0.0/schema.json",
  "version": "1.0",
  "artifacts": [{ "report": { "path": "$RpName" } }],
  "settings": { "enableAutoRecovery": true }
}
"@

Write-Host "Dashboard PBIP (4 pages + mesures DAX) : $Base\FindMe-Dashboard.pbip" -ForegroundColor Green
