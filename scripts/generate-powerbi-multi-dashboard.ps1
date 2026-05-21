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

# --- Modele semantique (tables findme_dw) ---
& (Join-Path $PSScriptRoot 'generate-powerbi-pbip.ps1') -OutputBase $Base -ProjectPrefix 'FindMe-Dashboard'

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
Write-Utf8NoBom (Join-Path $PagesDir "$pageExec\visuals\title01\visual.json") (New-TitleVisual 'title01' 24 16 900 'Find-Me — KPI Recrutement (Executive)')

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
Write-Utf8NoBom (Join-Path $PagesDir "$pageExec\visuals\tbl_kpi\visual.json") (New-Visual 'tbl_kpi' 24 220 1230 470 1000 4000 'tableEx' $qTableKpi)

# Page Managerial
Write-Utf8NoBom (Join-Path $PagesDir "$pageMgr\visuals\title02\visual.json") (New-TitleVisual 'title02' 24 16 900 'Find-Me — Missions & Candidatures (Managerial)')

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

# Page Operationnel
Write-Utf8NoBom (Join-Path $PagesDir "$pageOps\visuals\title03\visual.json") (New-TitleVisual 'title03' 24 16 900 'Find-Me — CV, Utilisateurs, Notifications (Operationnel)')

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
  "layoutOptimization": 0,
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

# definition.pbir
$pbir = @"
{
  "`$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json",
  "version": "2.0",
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
  "config": { "version": "2.0", "logicalId": "findme-dashboard-report-001" }
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
