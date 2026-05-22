import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface PbiVisualLayout {
  id: string;
  title: string;
  visualType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  measure?: string;
}

interface ChartPoint {
  label: string;
  value: number;
}

interface VisualData {
  kind: string;
  points?: ChartPoint[];
  scalars?: Record<string, number>;
  scalar?: number | null;
  suffix?: string;
  rows?: { indicateur?: string; valeur?: number; label?: string; value?: number }[];
  error?: string;
}

interface ExtraCard {
  slug: string;
  title: string;
  data: VisualData;
}

interface PbiPagePayload {
  level: string;
  layout: {
    width: number;
    height: number;
    displayName: string;
    visuals: PbiVisualLayout[];
  };
  measures: Record<string, number>;
  visuals: Record<string, VisualData>;
  extraCards?: ExtraCard[];
  filters: { year?: number; contract?: string };
}

interface BiFilters {
  years: number[];
  contracts: string[];
  roles: string[];
  countries: string[];
}

interface HubHealth {
  mysql: boolean;
  dw: boolean;
  dimDateRows?: number;
  etlRunning?: boolean;
  etlLastSuccess?: string | null;
  etlLastError?: string | null;
}

@Component({
  selector: 'app-bi-dashboard',
  templateUrl: './bi-dashboard.component.html',
  styleUrls: ['./bi-dashboard.component.scss'],
})
export class BiDashboardComponent implements OnInit, OnDestroy {
  hubStatus: 'unknown' | 'ok' | 'degraded' | 'error' = 'unknown';
  hubDetail = '';
  selectedReportLevel = 'executive';
  pageData: PbiPagePayload | null = null;
  biFilters: BiFilters = { years: [], contracts: [], roles: [], countries: [] };
  filterYear: number | null = null;
  filterContract = '(Tous)';
  filterRole = '(Tous)';
  filterCountry = '(Tous)';
  dataLoading = false;
  dataError = '';
  etlRunning = false;
  etlMessage = '';
  pbipHint = '';
  etlPollSub?: Subscription;
  routeSub?: Subscription;

  private readonly levels = [
    { id: 'executive', label: '01 - Executive' },
    { id: 'managerial', label: '02 - Managerial' },
    { id: 'operational', label: '03 - Operationnel' },
    { id: 'technique', label: '04 - Technique' },
  ];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  get levelsNav() {
    return this.levels;
  }

  get biHubBase(): string {
    return `http://${window.location.hostname}:3032`;
  }

  get canvasWidth(): number {
    return this.pageData?.layout?.width || 1280;
  }

  get canvasHeight(): number {
    return this.pageData?.layout?.height || 720;
  }

  get layoutVisuals(): PbiVisualLayout[] {
    return this.pageData?.layout?.visuals || [];
  }

  get extraCards(): ExtraCard[] {
    return this.pageData?.extraCards ?? [];
  }

  get headlineKpis(): { label: string; value: number | string }[] {
    const m = this.pageData?.measures || {};
    if (this.selectedReportLevel === 'executive' && Object.keys(m).length) {
      return [
        { label: 'Candidatures reçues', value: m['KPI Candidatures'] ?? 0 },
        { label: 'Acceptées', value: m['KPI Acceptees'] ?? 0 },
        { label: 'Missions actives', value: m['Missions (vue)'] ?? 0 },
        { label: 'Taux d’acceptation', value: `${m['KPI Taux %'] ?? 0} %` },
      ];
    }
    return [];
  }

  ngOnInit(): void {
    this.loadFilters();
    this.bindRouteNiveau();
    this.checkBiHub();
    this.loadPageData();
    this.loadDesktopInfo();
    this.startEtlPolling();
    this.routeSub = this.route.paramMap.subscribe(() => {
      this.bindRouteNiveau();
      this.loadPageData();
    });
  }

  ngOnDestroy(): void {
    this.etlPollSub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }

  visualData(id: string): VisualData | undefined {
    return this.pageData?.visuals?.[id];
  }

  maxBar(id: string): number {
    const pts = this.visualData(id)?.points || [];
    return Math.max(1, ...pts.map((p) => p.value));
  }

  donutTotal(id: string): number {
    const pts = this.visualData(id)?.points || [];
    return pts.reduce((s, p) => s + p.value, 0) || 1;
  }

  maxExtraBar(ex: ExtraCard): number {
    const pts = ex.data?.points || [];
    return Math.max(1, ...pts.map((p) => p.value));
  }

  canvasStyle(vis: PbiVisualLayout): Record<string, string> {
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    return {
      left: `${(vis.x / w) * 100}%`,
      top: `${(vis.y / h) * 100}%`,
      width: `${(vis.width / w) * 100}%`,
      height: `${(vis.height / h) * 100}%`,
    };
  }

  isSlicer(vis: PbiVisualLayout): boolean {
    return vis.visualType === 'slicer' || vis.id.startsWith('slicer_');
  }

  selectReportLevel(level: string): void {
    this.router.navigate(['/utilisateur/bi', level]);
  }

  onFilterChange(): void {
    this.loadPageData();
  }

  openPowerBiDesktop(): void {
    const url = `${this.biHubBase}/static/LANCER_POWER_BI.cmd`;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LANCER_POWER_BI.cmd';
    a.click();
    this.etlMessage =
      this.pbipHint ||
      'Fichier lancé : exécutez LANCER_POWER_BI.cmd à la racine du projet, ou ONE_COMMANDE_POWERBI.cmd';
  }

  runEtl(): void {
    this.etlMessage = 'Synchronisation de l’entrepôt…';
    this.http.post(`${this.biHubBase}/api/etl/run`, {}).subscribe({
      next: () => {
        this.etlRunning = true;
        this.etlMessage = 'Synchronisation en cours…';
      },
      error: (err) => {
        this.etlMessage =
          err?.status === 409
            ? 'Synchronisation déjà en cours.'
            : 'Service BI indisponible.';
      },
    });
  }

  hubStatusLabel(): string {
    const map: Record<string, string> = {
      ok: 'Données à jour',
      degraded: 'Entrepôt à synchroniser',
      error: 'Service indisponible',
      unknown: 'Vérification…',
    };
    return map[this.hubStatus] || map['unknown'];
  }

  private bindRouteNiveau(): void {
    const niveau = (this.route.snapshot.paramMap.get('niveau') || 'executive').toLowerCase();
    this.selectedReportLevel = ['executive', 'managerial', 'operational', 'technique'].includes(
      niveau
    )
      ? niveau
      : 'executive';
  }

  private loadFilters(): void {
    this.http.get<BiFilters>(`${this.biHubBase}/api/powerbi/filters`).subscribe({
      next: (f) => {
        this.biFilters = f;
        if (f.years?.length) {
          const valid = f.years.filter((y) => y >= 2000 && y <= 2030);
          if (valid.length && this.filterYear == null) {
            this.filterYear = valid[0];
          } else if (this.filterYear != null && !valid.includes(this.filterYear)) {
            this.filterYear = valid[0] ?? null;
            this.loadPageData();
          }
        }
      },
    });
  }

  private loadDesktopInfo(): void {
    this.http.get<{ powerBiDesktopHint: string; pbipRelative: string }>(
      `${this.biHubBase}/api/powerbi/desktop`
    ).subscribe({
      next: (d) => {
        this.pbipHint = `${d.powerBiDesktopHint} Projet : ${d.pbipRelative}`;
      },
    });
  }

  private loadPageData(): void {
    this.dataLoading = true;
    this.dataError = '';
    const params: Record<string, string> = { t: Date.now().toString() };
    if (this.filterYear != null) {
      params['year'] = String(this.filterYear);
    }
    if (this.filterContract && this.filterContract !== '(Tous)') {
      params['contract'] = this.filterContract;
    }
    this.http
      .get<PbiPagePayload>(`${this.biHubBase}/api/powerbi/page/${this.selectedReportLevel}`, {
        params,
      })
      .subscribe({
        next: (data) => {
          this.pageData = data;
          this.dataLoading = false;
        },
        error: () => {
          this.pageData = null;
          this.dataLoading = false;
          this.dataError =
            'Données indisponibles. Reconstruisez bi-hub : docker compose build bi-hub && docker compose up -d bi-hub';
        },
      });
  }

  private checkBiHub(): void {
    this.http.get<HubHealth>(`${this.biHubBase}/api/health`).subscribe({
      next: (h) => {
        this.etlRunning = !!h.etlRunning;
        if (h.mysql && h.dw) {
          this.hubStatus = 'ok';
          this.hubDetail = `Entrepôt findme_dw · ${h.dimDateRows ?? 0} périodes`;
        } else if (h.mysql) {
          this.hubStatus = 'degraded';
        } else {
          this.hubStatus = 'error';
        }
      },
      error: () => (this.hubStatus = 'error'),
    });
  }

  private startEtlPolling(): void {
    this.etlPollSub?.unsubscribe();
    this.etlPollSub = interval(5000)
      .pipe(switchMap(() => this.http.get<HubHealth>(`${this.biHubBase}/api/health`)))
      .subscribe({
        next: (h) => {
          const was = this.etlRunning;
          this.etlRunning = !!h.etlRunning;
          if (was && !this.etlRunning) {
            this.loadPageData();
            this.checkBiHub();
            if (h.etlLastSuccess) {
              this.etlMessage = `Synchronisation terminée`;
            }
          }
        },
      });
  }
}
