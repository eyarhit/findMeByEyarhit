# Genere PBIP multi-pages (3 dashboards) + modele findme_dw — sans config manuelle
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Base = Join-Path $Root "bi\powerbi\FindMe-Dashboard"
$SmName = "FindMe-Dashboard.SemanticModel"
$RpName = "FindMe-Dashboard.Report"
$Sm = Join-Path $Base $SmName
$Rp = Join-Path $Base $RpName
$PagesDir = Join-Path $Rp "definition\pages"

$script:Utf8NoBom = New-Object System.Text.UTF8Encoding $false
function Write-Utf8NoBom([string]$Path, [string]$Content) {
    $dir = Split-Path $Path -Parent
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($Path, $Content, $script:Utf8NoBom)
}
function New-Dir($p) { if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p -Force | Out-Null } }

function Get-VisualContainerObjects {
    @{
        background = @(@{ properties = @{ show = @{ expr = @{ Literal = @{ Value = "'false'" } } } } })
        border     = @(@{ properties = @{ show = @{ expr = @{ Literal = @{ Value = "'false'" } } } } })
        dropShadow = @(@{ properties = @{ show = @{ expr = @{ Literal = @{ Value = "'false'" } } } } })
        title      = @(@{ properties = @{ show = @{ expr = @{ Literal = @{ Value = "'false'" } } } } })
    }
}

function New-ColumnProjection($entity, $property, [bool]$active = $false) {
    @{
        field = @{
            Column = @{
                Expression = @{ SourceRef = @{ Entity = $entity } }
                Property = $property
            }
        }
        queryRef = "$entity.$property"
        active = $active
    }
}

function New-SumProjection($entity, $property) {
    @{
        field = @{
            Aggregation = @{
                Expression = @{
                    Column = @{
                        Expression = @{ SourceRef = @{ Entity = $entity } }
                        Property = $property
                    }
                }
                Function = 0
            }
        }
        queryRef = "Sum($entity.$property)"
    }
}

function New-AvgProjection($entity, $property) {
    @{
        field = @{
            Aggregation = @{
                Expression = @{
                    Column = @{
                        Expression = @{ SourceRef = @{ Entity = $entity } }
                        Property = $property
                    }
                }
                Function = 1
            }
        }
        queryRef = "Avg($entity.$property)"
    }
}

function New-Visual($id, $x, $y, $w, $h, $z, $tabOrder, $visualType, $queryState, $objects = @{}) {
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

function New-PageJson($id, $displayName) {
    @{
        '$schema' = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.1.0/schema.json'
        name = $id
        displayName = $displayName
        displayOption = 'FitToPage'
        height = 720
        width = 1280
        objects = @{
            background = @(@{
                properties = @{
                    color = @{
                        solid = @{
                            color = @{ expr = @{ Literal = @{ Value = "'#F5F7FA'" } } }
                        }
                    }
                    transparency = @{ expr = @{ Literal = @{ Value = '0D' } } }
                }
            })
        }
    } | ConvertTo-Json -Depth 20 -Compress:$false
}

function New-TitleVisual($id, $x, $y, $w, $title) {
    $objects = @{
        general = @(@{
            properties = @{
                paragraphs = @(@{
                    textRuns = @(@{
                        value = $title
                        textStyle = @{ fontSize = '22pt'; fontWeight = 'bold'; color = '#1B3A57' }
                    })
                })
            }
        })
    }
    New-Visual $id $x $y $w 48 1000 0 'textbox' $null $objects
}

# GUID fixes (Power BI exige un Guid pour logicalId)
$SemanticLogicalId = '2e8b4f1a-6c3d-4b9e-a1f0-3c7d9e2b4f6a'
$ReportLogicalId     = '7f3a9c2e-4b1d-4e8a-9f2c-1d5e6a7b8c9d'

# --- Modele semantique (tables findme_dw) ---
& (Join-Path $PSScriptRoot 'generate-powerbi-pbip.ps1') -OutputBase $Base -ProjectPrefix 'FindMe-Dashboard' -SemanticModelOnly -SemanticLogicalId $SemanticLogicalId

# --- Pages ---
$pageExec = 'page_exec_findme01'
$pageMgr  = 'page_mgr_findme02'
$pageOps  = 'page_ops_findme03'

New-Dir $PagesDir
New-Dir (Join-Path $PagesDir $pageExec)
New-Dir (Join-Path $PagesDir "$pageExec\visuals")
New-Dir (Join-Path $PagesDir $pageMgr)
New-Dir (Join-Path $PagesDir "$pageMgr\visuals")
New-Dir (Join-Path $PagesDir $pageOps)
New-Dir (Join-Path $PagesDir "$pageOps\visuals")

$pagesMeta = @{
    '$schema' = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/pagesMetadata/1.0.0/schema.json'
    pageOrder = @($pageExec, $pageMgr, $pageOps)
    activePageName = $pageExec
} | ConvertTo-Json -Depth 10 -Compress:$false
Write-Utf8NoBom (Join-Path $PagesDir 'pages.json') $pagesMeta

Write-Utf8NoBom (Join-Path $PagesDir "$pageExec\page.json") (New-PageJson $pageExec '01 - Executive')
Write-Utf8NoBom (Join-Path $PagesDir "$pageMgr\page.json") (New-PageJson $pageMgr '02 - Managerial')
Write-Utf8NoBom (Join-Path $PagesDir "$pageOps\page.json") (New-PageJson $pageOps '03 - Operationnel')

# Page Executive
Write-Utf8NoBom (Join-Path $PagesDir "$pageExec\visuals\title01\visual.json") (New-TitleVisual 'title01' 24 16 900 'Find-Me - KPI Recrutement (Executive)')

$qCard1 = @{ Values = @{ projections = @(New-SumProjection 'v_bi_kpi_recrutement' 'candidatures') } }
$qCard2 = @{ Values = @{ projections = @(New-SumProjection 'v_bi_kpi_recrutement' 'acceptees') } }
$qCard3 = @{ Values = @{ projections = @(New-AvgProjection 'v_bi_kpi_recrutement' 'taux_acceptation_pct') } }
Write-Utf8NoBom (Join-Path $PagesDir "$pageExec\visuals\kpi_cand\visual.json") (New-Visual 'kpi_cand' 24 80 280 120 2000 1000 'card' $qCard1)
Write-Utf8NoBom (Join-Path $PagesDir "$pageExec\visuals\kpi_acc\visual.json") (New-Visual 'kpi_acc' 320 80 280 120 2001 2000 'card' $qCard2)
Write-Utf8NoBom (Join-Path $PagesDir "$pageExec\visuals\kpi_tx\visual.json") (New-Visual 'kpi_tx' 616 80 280 120 2002 3000 'card' $qCard3)

$qTableKpi = @{
    Values = @{
        projections = @(
            (New-ColumnProjection 'v_bi_kpi_recrutement' 'year_num' $true),
            (New-ColumnProjection 'v_bi_kpi_recrutement' 'month_num'),
            (New-ColumnProjection 'v_bi_kpi_recrutement' 'candidatures'),
            (New-ColumnProjection 'v_bi_kpi_recrutement' 'acceptees'),
            (New-ColumnProjection 'v_bi_kpi_recrutement' 'refusees'),
            (New-ColumnProjection 'v_bi_kpi_recrutement' 'taux_acceptation_pct')
        )
    }
}
Write-Utf8NoBom (Join-Path $PagesDir "$pageExec\visuals\tbl_kpi\visual.json") (New-Visual 'tbl_kpi' 590 210 660 480 1000 4000 'tableEx' $qTableKpi)

$qSlicerYear = @{ Values = @{ projections = @(New-ColumnProjection 'dim_date' 'year_num' $true) } }
Write-Utf8NoBom (Join-Path $PagesDir "$pageExec\visuals\slicer_year\visual.json") (New-Visual 'slicer_year' 920 72 340 88 3000 5000 'slicer' $qSlicerYear)

$qLineTrend = @{
    Category = @{ projections = @(New-ColumnProjection 'v_bi_kpi_recrutement' 'month_num' $true) }
    Y        = @{ projections = @(New-SumProjection 'v_bi_kpi_recrutement' 'candidatures') }
}
Write-Utf8NoBom (Join-Path $PagesDir "$pageExec\visuals\line_trend\visual.json") (New-Visual 'line_trend' 24 210 550 200 1001 3000 'lineChart' $qLineTrend)

$qDonutExec = @{
    Category = @{ projections = @(New-ColumnProjection 'v_bi_kpi_recrutement' 'month_num' $true) }
    Y        = @{ projections = @(New-SumProjection 'v_bi_kpi_recrutement' 'acceptees') }
}
Write-Utf8NoBom (Join-Path $PagesDir "$pageExec\visuals\donut_acc\visual.json") (New-Visual 'donut_acc' 24 430 350 260 1002 3500 'donutChart' $qDonutExec)

# Page Managerial
Write-Utf8NoBom (Join-Path $PagesDir "$pageMgr\visuals\title02\visual.json") (New-TitleVisual 'title02' 24 16 900 'Find-Me - Missions et Candidatures (Managerial)')

$qBarMission = @{
    Category = @{ projections = @(New-ColumnProjection 'v_bi_mission' 'mission_name' $true) }
    Y        = @{ projections = @(New-SumProjection 'v_bi_mission' 'mission_count') }
}
Write-Utf8NoBom (Join-Path $PagesDir "$pageMgr\visuals\bar_mission\visual.json") (New-Visual 'bar_mission' 24 80 600 300 1000 1000 'clusteredBarChart' $qBarMission)

$qBarCand = @{
    Category = @{ projections = @(New-ColumnProjection 'v_bi_candidature' 'statut_candidature' $true) }
    Y        = @{ projections = @(New-SumProjection 'v_bi_candidature' 'candidature_count') }
}
Write-Utf8NoBom (Join-Path $PagesDir "$pageMgr\visuals\bar_statut\visual.json") (New-Visual 'bar_statut' 640 80 600 300 1001 2000 'clusteredBarChart' $qBarCand)

$qTblCand = @{
    Values = @{
        projections = @(
            (New-ColumnProjection 'v_bi_candidature' 'mission_name' $true),
            (New-ColumnProjection 'v_bi_candidature' 'statut_candidature'),
            (New-ColumnProjection 'v_bi_candidature' 'candidature_count'),
            (New-ColumnProjection 'v_bi_candidature' 'ville'),
            (New-ColumnProjection 'v_bi_candidature' 'year_num')
        )
    }
}
Write-Utf8NoBom (Join-Path $PagesDir "$pageMgr\visuals\tbl_cand\visual.json") (New-Visual 'tbl_cand' 24 400 1230 290 1000 3000 'tableEx' $qTblCand)

$qSlicerStatut = @{ Values = @{ projections = @(New-ColumnProjection 'v_bi_candidature' 'statut_candidature' $true) } }
Write-Utf8NoBom (Join-Path $PagesDir "$pageMgr\visuals\slicer_statut\visual.json") (New-Visual 'slicer_statut' 920 72 340 88 3000 5000 'slicer' $qSlicerStatut)

$qSlicerMgrYear = @{ Values = @{ projections = @(New-ColumnProjection 'v_bi_candidature' 'year_num' $true) } }
Write-Utf8NoBom (Join-Path $PagesDir "$pageMgr\visuals\slicer_year\visual.json") (New-Visual 'slicer_year' 920 172 340 88 3001 5100 'slicer' $qSlicerMgrYear)

$qColMission = @{
    Category = @{ projections = @(New-ColumnProjection 'dim_mission' 'status_mission' $true) }
    Y        = @{ projections = @(New-SumProjection 'v_bi_mission' 'mission_count') }
}
Write-Utf8NoBom (Join-Path $PagesDir "$pageMgr\visuals\col_status\visual.json") (New-Visual 'col_status' 24 400 580 290 1002 4000 'columnChart' $qColMission)

# Page Operationnel
Write-Utf8NoBom (Join-Path $PagesDir "$pageOps\visuals\title03\visual.json") (New-TitleVisual 'title03' 24 16 900 'Find-Me - CV, Utilisateurs, Notifications (Operationnel)')

$qCardUsers = @{ Values = @{ projections = @(New-SumProjection 'fact_user' 'user_count') } }
$qCardCv    = @{ Values = @{ projections = @(New-SumProjection 'fact_cv' 'cv_count') } }
$qCardNotif = @{ Values = @{ projections = @(New-SumProjection 'fact_notification' 'notification_count') } }
Write-Utf8NoBom (Join-Path $PagesDir "$pageOps\visuals\kpi_users\visual.json") (New-Visual 'kpi_users' 24 80 280 120 2000 1000 'card' $qCardUsers)
Write-Utf8NoBom (Join-Path $PagesDir "$pageOps\visuals\kpi_cv\visual.json") (New-Visual 'kpi_cv' 320 80 280 120 2001 2000 'card' $qCardCv)
Write-Utf8NoBom (Join-Path $PagesDir "$pageOps\visuals\kpi_notif\visual.json") (New-Visual 'kpi_notif' 616 80 280 120 2002 3000 'card' $qCardNotif)

$qTblNotif = @{
    Values = @{
        projections = @(
            (New-ColumnProjection 'fact_notification' 'user_id_degen' $true),
            (New-ColumnProjection 'fact_notification' 'notification_count'),
            (New-ColumnProjection 'fact_notification' 'is_read'),
            (New-ColumnProjection 'fact_notification' 'date_key')
        )
    }
}
Write-Utf8NoBom (Join-Path $PagesDir "$pageOps\visuals\tbl_notif\visual.json") (New-Visual 'tbl_notif' 24 220 600 470 1000 4000 'tableEx' $qTblNotif)

$qTblCv = @{
    Values = @{
        projections = @(
            (New-ColumnProjection 'fact_cv' 'user_key' $true),
            (New-ColumnProjection 'fact_cv' 'cv_count'),
            (New-ColumnProjection 'fact_cv' 'steps_completed'),
            (New-ColumnProjection 'fact_cv' 'date_key')
        )
    }
}
Write-Utf8NoBom (Join-Path $PagesDir "$pageOps\visuals\tbl_cv\visual.json") (New-Visual 'tbl_cv' 640 220 610 470 1001 5000 'tableEx' $qTblCv)

$qCardMission = @{ Values = @{ projections = @(New-SumProjection 'fact_mission' 'mission_count') } }
Write-Utf8NoBom (Join-Path $PagesDir "$pageOps\visuals\kpi_mission\visual.json") (New-Visual 'kpi_mission' 920 72 280 120 2003 1000 'card' $qCardMission)

$qSlicerRead = @{ Values = @{ projections = @(New-ColumnProjection 'fact_notification' 'is_read' $true) } }
Write-Utf8NoBom (Join-Path $PagesDir "$pageOps\visuals\slicer_read\visual.json") (New-Visual 'slicer_read' 920 210 340 88 3000 6000 'slicer' $qSlicerRead)

$qBarSkill = @{
    Category = @{ projections = @(New-ColumnProjection 'dim_skill' 'skill_label' $true) }
    Y        = @{ projections = @(New-SumProjection 'dim_skill' 'usage_count') }
}
Write-Utf8NoBom (Join-Path $PagesDir "$pageOps\visuals\bar_skills\visual.json") (New-Visual 'bar_skills' 24 430 1230 260 1002 5500 'clusteredBarChart' $qBarSkill)

# report.json (PBIR)
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
    "useEnhancedTooltips": true
  }
}
'@
Write-Utf8NoBom (Join-Path $Rp 'definition\report.json') $reportJson

$versionJson = @'
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/versionMetadata/1.0.0/schema.json",
  "version": "2.0.0"
}
'@
Write-Utf8NoBom (Join-Path $Rp 'definition\version.json') $versionJson

# definition.pbir
$pbir = @"
{
  "`$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json",
  "version": "4.0",
  "datasetReference": {
    "byPath": { "path": "../$SmName" }
  }
}
"@
Write-Utf8NoBom (Join-Path $Rp 'definition.pbir') $pbir

# .platform report
$plat = @"
{
  "`$schema": "https://developer.microsoft.com/json-schemas/fabric/gitIntegration/platformProperties/2.0.0/schema.json",
  "metadata": { "type": "Report", "displayName": "FindMe-Dashboard" },
  "config": { "version": "2.0", "logicalId": "$ReportLogicalId" }
}
"@
Write-Utf8NoBom (Join-Path $Rp '.platform') $plat

# .pbip
$pbip = @"
{
  "`$schema": "https://developer.microsoft.com/json-schemas/fabric/pbip/pbipProperties/1.0.0/schema.json",
  "version": "1.0",
  "artifacts": [
    { "report": { "path": "$RpName" } }
  ],
  "settings": { "enableAutoRecovery": true }
}
"@
Write-Utf8NoBom (Join-Path $Base 'FindMe-Dashboard.pbip') $pbip

Write-Host "Dashboard PBIP (3 pages) : $Base\FindMe-Dashboard.pbip" -ForegroundColor Green
