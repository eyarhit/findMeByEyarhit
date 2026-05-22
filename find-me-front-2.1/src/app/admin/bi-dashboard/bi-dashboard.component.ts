import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface BiManifestCard {
  id: number;
  slug: string;
  title: string;
  domain: string;
  display: string;
  db: string;
  powerBiPage?: string;
}

export interface BiManifestTab {
  key: string;
  label: string;
  cardSlugs: string[];
}

export interface BiPowerBiReport {
  level: string;
  name: string;
  page?: string;
  description?: string;
}

export interface BiManifest {
  version: number;
  dwDatabase: string;
  biHub?: { port: number; healthUrl?: string };
  powerBi?: {
    pbipProject?: string;
    connectionHint?: string;
    reports: BiPowerBiReport[];
  };
  cards: BiManifestCard[];
  tabs: BiManifestTab[];
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface CardChart {
  slug?: string;
  kind: string;
  points: ChartPoint[];
  scalars: Record<string, number>;
  scalar: number | null;
  error?: string;
  rows?: Record<string, unknown>[];
}

interface HubHealth {
  mysql: boolean;
  dw: boolean;
  dimDateRows?: number;
  etlRunning?: boolean;
  etlLastSuccess?: string | null;
  etlLastError?: string | null;
}

interface ExecutiveKpis {
  total_utilisateurs?: number;
  total_missions?: number;
  total_candidatures?: number;
  total_cv?: number;
}

interface PbiConnection {
  server: string;
  port: number;
  database: string;
  user: string;
}

@Component({
  selector: 'app-bi-dashboard',
  templateUrl: './bi-dashboard.component.html',
  styleUrls: ['./bi-dashboard.component.scss'],
})
export class BiDashboardComponent implements OnInit, OnDestroy {
  manifest: BiManifest | null = null;
  manifestError = '';
  hubStatus: 'unknown' | 'ok' | 'degraded' | 'error' = 'unknown';
  hubDetail = '';
  selectedReportLevel = 'executive';
  executiveKpis: ExecutiveKpis | null = null;
  dwStats: Record<string, number> = {};
  cardCharts: Record<string, CardChart> = {};
  chartsLoading = false;
  chartsError = '';
  pbiConnection: PbiConnection | null = null;
  etlRunning = false;
  etlMessage = '';
  etlPollSub?: Subscription;
  routeSub?: Subscription;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  get reports(): BiPowerBiReport[] {
    return this.manifest?.powerBi?.reports || [];
  }

  get selectedReport(): BiPowerBiReport | undefined {
    return (
      this.reports.find((r) => r.level === this.selectedReportLevel) ||
      this.reports[0]
    );
  }

  get pageCards(): BiManifestCard[] {
    const tab = this.manifest?.tabs?.find((t) => t.key === this.selectedReportLevel);
    const slugs = new Set(tab?.cardSlugs || []);
    return (this.manifest?.cards || []).filter((c) => slugs.has(c.slug));
  }

  get biHubBase(): string {
    const port = this.manifest?.biHub?.port ?? 3032;
    return `http://${window.location.hostname}:${port}`;
  }

  get headlineKpis(): { label: string; value: number | string }[] {
    if (this.selectedReportLevel === 'executive' && this.executiveKpis) {
      return [
        { label: 'Utilisateurs', value: this.executiveKpis.total_utilisateurs ?? 0 },
        { label: 'Missions', value: this.executiveKpis.total_missions ?? 0 },
        { label: 'Candidatures', value: this.executiveKpis.total_candidatures ?? 0 },
        { label: 'CV', value: this.executiveKpis.total_cv ?? 0 },
      ];
    }
    if (this.selectedReportLevel === 'technique') {
      return [
        { label: 'Dates DW', value: this.dwStats['dim_date'] ?? 0 },
        { label: 'Utilisateurs DW', value: this.dwStats['dim_user'] ?? 0 },
        { label: 'Candidatures (fait)', value: this.dwStats['fact_candidature'] ?? 0 },
        { label: 'CV (fait)', value: this.dwStats['fact_cv'] ?? 0 },
      ];
    }
    const keys = ['fact_candidature', 'fact_mission', 'fact_user', 'fact_cv'] as const;
    const labels = ['Candidatures', 'Missions', 'Activité users', 'CV'];
    return keys.map((k, i) => ({
      label: labels[i],
      value: this.dwStats[k] ?? '—',
    }));
  }

  ngOnInit(): void {
    this.http
      .get<BiManifest>('/assets/bi/bi-manifest.json', {
        params: { t: Date.now().toString() },
      })
      .subscribe({
        next: (m) => {
          this.manifest = m;
          this.bindRouteNiveau();
          this.refreshHubData();
          this.startEtlPolling();
        },
        error: () => {
          this.manifestError =
            'Configuration BI indisponible. Relancez Docker puis actualisez la page.';
        },
      });

    this.routeSub = this.route.paramMap.subscribe(() => {
      this.bindRouteNiveau();
      if (this.manifest) {
        this.loadPageCharts();
      }
    });
  }

  ngOnDestroy(): void {
    this.etlPollSub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }

  chartFor(slug: string): CardChart | undefined {
    return this.cardCharts[slug];
  }

  maxChartValue(slug: string): number {
    const pts = this.chartFor(slug)?.points || [];
    return Math.max(1, ...pts.map((p) => p.value));
  }

  donutTotal(slug: string): number {
    const pts = this.chartFor(slug)?.points || [];
    return pts.reduce((s, p) => s + p.value, 0) || 1;
  }

  scalarKeys(slug: string): string[] {
    return Object.keys(this.chartFor(slug)?.scalars || {});
  }

  formatScalarKey(key: string): string {
    return key.replace(/_/g, ' ');
  }

  selectReportLevel(level: string): void {
    this.router.navigate(['/utilisateur/bi', level]);
  }

  runEtl(): void {
    this.etlMessage = 'Actualisation de l’entrepôt…';
    this.http.post(`${this.biHubBase}/api/etl/run`, {}).subscribe({
      next: () => {
        this.etlRunning = true;
        this.etlMessage = 'Synchronisation findme_dw en cours…';
      },
      error: (err) => {
        this.etlMessage =
          err?.status === 409
            ? 'Synchronisation déjà en cours.'
            : 'Service BI indisponible — reconstruire bi-hub : docker compose build bi-hub && docker compose up -d bi-hub';
      },
    });
  }

  hubStatusLabel(): string {
    const map: Record<string, string> = {
      ok: 'Données alignées avec Power BI',
      degraded: 'Entrepôt vide — lancer la synchronisation',
      error: 'Entrepôt inaccessible',
      unknown: 'Vérification…',
    };
    return map[this.hubStatus] || map['unknown'];
  }

  private bindRouteNiveau(): void {
    const niveau = (this.route.snapshot.paramMap.get('niveau') || 'executive').toLowerCase();
    const allowed = ['executive', 'managerial', 'operational', 'technique'];
    this.selectedReportLevel = allowed.includes(niveau) ? niveau : 'executive';
  }

  private refreshHubData(): void {
    this.checkBiHub();
    this.loadExecutiveKpis();
    this.loadDwStats();
    this.loadPageCharts();
    this.loadPbiConnection();
  }

  private loadPageCharts(): void {
    if (!this.manifest) {
      return;
    }
    this.chartsLoading = true;
    this.chartsError = '';
    this.http
      .get<{ level: string; charts: Record<string, CardChart> }>(
        `${this.biHubBase}/api/kpis/page/${this.selectedReportLevel}`,
        { params: { t: Date.now().toString() } }
      )
      .subscribe({
        next: (res) => {
          this.cardCharts = res.charts || {};
          this.chartsLoading = false;
        },
        error: () => {
          this.cardCharts = {};
          this.chartsLoading = false;
          this.chartsError =
            'Impossible de charger les graphiques. Reconstruisez le conteneur bi-hub (git pull + docker compose build bi-hub).';
        },
      });
  }

  private checkBiHub(): void {
    const url = this.manifest?.biHub?.healthUrl || `${this.biHubBase}/api/health`;
    this.http.get<HubHealth>(url).subscribe({
      next: (h) => {
        this.etlRunning = !!h.etlRunning;
        if (h.etlRunning) {
          this.etlMessage = 'Synchronisation en cours…';
        } else if (h.etlLastSuccess) {
          this.etlMessage = `Dernière synchro : ${h.etlLastSuccess}`;
        } else if (h.etlLastError) {
          this.etlMessage = `Erreur : ${h.etlLastError}`;
        } else {
          this.etlMessage = '';
        }
        if (h.mysql && h.dw) {
          this.hubStatus = 'ok';
          this.hubDetail = `Entrepôt ${this.manifest?.dwDatabase || 'findme_dw'} · ${h.dimDateRows ?? 0} périodes`;
        } else if (h.mysql) {
          this.hubStatus = 'degraded';
          this.hubDetail = 'Lancer la synchronisation des données';
        } else {
          this.hubStatus = 'error';
          this.hubDetail = 'MySQL Docker non démarré';
        }
      },
      error: () => {
        this.hubStatus = 'error';
        this.hubDetail = 'docker compose up -d mysql bi-hub';
      },
    });
  }

  private loadExecutiveKpis(): void {
    this.http.get<ExecutiveKpis>(`${this.biHubBase}/api/kpis/executive`).subscribe({
      next: (k) => (this.executiveKpis = k),
      error: () => (this.executiveKpis = null),
    });
  }

  private loadDwStats(): void {
    this.http
      .get<{ tables: Record<string, number> }>(`${this.biHubBase}/api/dw/stats`)
      .subscribe({
        next: (s) => (this.dwStats = s.tables || {}),
        error: () => (this.dwStats = {}),
      });
  }

  private loadPbiConnection(): void {
    this.http
      .get<PbiConnection>(`${this.biHubBase}/api/powerbi/connection`)
      .subscribe({
        next: (c) => (this.pbiConnection = c),
        error: () => (this.pbiConnection = null),
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
            if (h.etlLastSuccess) {
              this.etlMessage = `Synchronisation terminée : ${h.etlLastSuccess}`;
            }
            this.refreshHubData();
          }
        },
      });
  }
}
