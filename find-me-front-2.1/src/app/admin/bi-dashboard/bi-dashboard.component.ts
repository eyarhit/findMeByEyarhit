import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import { Subscription, interval, of } from 'rxjs';
import { catchError, distinctUntilChanged, finalize, map, switchMap, timeout } from 'rxjs/operators';

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
  biHub?: BiHubConfig;
  powerBi?: { reports: BiPowerBiReport[] };
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

interface BiHubConfig {
  port?: number;
  healthPath?: string;
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

const CHART_COLORS = [
  '#5A3FC9',
  '#7367F0',
  '#22C55E',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#EC4899',
  '#8B5CF6',
];

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
  cardLoading: Record<string, boolean> = {};
  chartsLoading = false;
  chartsError = '';
  etlRunning = false;
  etlMessage = '';
  periodMonths = 0;
  autoRefresh = false;
  lastUpdate: Date | null = null;

  private chartInstances = new Map<string, Chart>();
  private chartsReqSub?: Subscription;
  private etlPollSub?: Subscription;
  private refreshSub?: Subscription;
  private routeSub?: Subscription;
  private renderTimer?: ReturnType<typeof setTimeout>;
  private currentLoadLevel = '';

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
    const hub = this.manifest?.biHub;
    const hubPort = hub?.port ?? 3032;
    return `http://${window.location.hostname}:${hubPort}`;
  }

  get headlineKpis(): { label: string; value: number | string; icon: string }[] {
    if (this.selectedReportLevel === 'executive' && this.executiveKpis) {
      return [
        { label: 'Utilisateurs', value: this.executiveKpis.total_utilisateurs ?? 0, icon: 'users' },
        { label: 'Missions', value: this.executiveKpis.total_missions ?? 0, icon: 'missions' },
        { label: 'Candidatures', value: this.executiveKpis.total_candidatures ?? 0, icon: 'apps' },
        { label: 'CV', value: this.executiveKpis.total_cv ?? 0, icon: 'cv' },
      ];
    }
    if (this.selectedReportLevel === 'technique') {
      return [
        { label: 'Dates DW', value: this.dwStats['dim_date'] ?? 0, icon: 'dates' },
        { label: 'Users DW', value: this.dwStats['dim_user'] ?? 0, icon: 'users' },
        { label: 'Candidatures', value: this.dwStats['fact_candidature'] ?? 0, icon: 'apps' },
        { label: 'CV', value: this.dwStats['fact_cv'] ?? 0, icon: 'cv' },
      ];
    }
    return [
      { label: 'Candidatures', value: this.dwStats['fact_candidature'] ?? '—', icon: 'apps' },
      { label: 'Missions', value: this.dwStats['fact_mission'] ?? '—', icon: 'missions' },
      { label: 'Users', value: this.dwStats['fact_user'] ?? '—', icon: 'users' },
      { label: 'CV', value: this.dwStats['fact_cv'] ?? '—', icon: 'cv' },
    ];
  }

  ngOnInit(): void {
    this.routeSub = this.route.paramMap
      .pipe(
        map((pm) => (pm.get('niveau') || 'executive').toLowerCase()),
        distinctUntilChanged()
      )
      .subscribe((niveau) => {
        const allowed = ['executive', 'managerial', 'operational', 'technique'];
        this.selectedReportLevel = allowed.includes(niveau) ? niveau : 'executive';
        if (!this.manifest) {
          return;
        }
        this.loadHeadlineKpis();
        this.loadPageCharts();
      });

    this.http
      .get<BiManifest>('/assets/bi/bi-manifest.json', { params: { t: Date.now().toString() } })
      .subscribe({
        next: (m) => {
          this.manifest = m;
          this.bindRouteNiveau();
          if (!this.route.snapshot.paramMap.get('niveau')) {
            void this.router.navigate(['/utilisateur/bi/executive'], { replaceUrl: true });
            return;
          }
          this.refreshHubData();
          this.startEtlPolling();
          this.startAutoRefresh();
        },
        error: () => {
          this.manifestError =
            'Configuration BI indisponible. Relancez Docker puis actualisez la page.';
        },
      });
  }

  ngOnDestroy(): void {
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
    }
    this.destroyCharts();
    this.chartsReqSub?.unsubscribe();
    this.etlPollSub?.unsubscribe();
    this.refreshSub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }

  chartFor(slug: string): CardChart | undefined {
    return this.cardCharts[slug];
  }

  filteredPoints(slug: string): ChartPoint[] {
    const pts = [...(this.chartFor(slug)?.points || [])];
    if (!this.periodMonths || this.periodMonths <= 0) {
      return pts;
    }
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - this.periodMonths);
    return pts.filter((p) => {
      const m = /^(\d{4})-(\d{1,2})/.exec(p.label);
      if (!m) {
        return true;
      }
      const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, 1);
      return d >= cutoff;
    });
  }

  scalarKeys(slug: string): string[] {
    return Object.keys(this.chartFor(slug)?.scalars || {});
  }

  formatScalarKey(key: string): string {
    return key.replace(/_/g, ' ');
  }

  usesCanvas(slug: string): boolean {
    const k = this.chartFor(slug)?.kind;
    return !!k && !['matrix', 'error', 'empty', 'table', 'kpi'].includes(k);
  }

  isWideWidget(card: BiManifestCard): boolean {
    const k = this.chartFor(card.slug)?.kind;
    return k === 'matrix' || k === 'line' || k === 'table' || card.slug === 'executive_kpis';
  }

  isCardLoading(slug: string): boolean {
    return !!this.cardLoading[slug];
  }

  tableRows(slug: string): Record<string, unknown>[] {
    return this.chartFor(slug)?.rows || [];
  }

  tableColumns(slug: string): string[] {
    const rows = this.tableRows(slug);
    if (!rows.length) {
      return [];
    }
    return Object.keys(rows[0]);
  }

  formatCell(value: unknown): string {
    if (value == null) {
      return '—';
    }
    if (typeof value === 'number') {
      return Number.isInteger(value) ? String(value) : value.toFixed(1);
    }
    return String(value);
  }

  selectReportLevel(level: string): void {
    this.currentLoadLevel = '';
    this.router.navigate(['/utilisateur/bi', level]);
  }

  onFilterChange(): void {
    this.scheduleRenderCharts();
  }

  runEtl(): void {
    this.etlMessage = 'Synchronisation findme_dw…';
    this.http.post(`${this.biHubBase}/api/etl/run`, {}).subscribe({
      next: () => {
        this.etlRunning = true;
        this.etlMessage = 'Synchronisation en cours…';
      },
      error: (err) => {
        this.etlMessage =
          err?.status === 409
            ? 'Synchronisation déjà en cours.'
            : 'Hub BI indisponible (docker compose up -d bi-hub).';
      },
    });
  }

  hubStatusLabel(): string {
    const map: Record<string, string> = {
      ok: 'Connecté à findme_dw',
      degraded: 'Entrepôt vide',
      error: 'Base inaccessible',
      unknown: '…',
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
    this.loadHeadlineKpis();
    this.loadPageCharts();
  }

  private loadHeadlineKpis(): void {
    this.loadExecutiveKpis();
    this.loadDwStats();
  }

  private loadPageCharts(background = false): void {
    if (!this.manifest) {
      return;
    }
    const level = this.selectedReportLevel;
    const slugs = this.pageCards.map((c) => c.slug);
    if (!slugs.length) {
      this.chartsLoading = false;
      return;
    }

    if (!background && this.currentLoadLevel === level && Object.keys(this.cardCharts).length > 0) {
      return;
    }
    this.currentLoadLevel = level;

    const hasCharts = slugs.some((s) => {
      const k = this.cardCharts[s]?.kind;
      return !!k && k !== 'error';
    });
    if (!background || !hasCharts) {
      this.chartsLoading = true;
    }
    this.chartsError = '';
    if (!background) {
      this.destroyCharts();
      this.cardCharts = {};
    }

    slugs.forEach((s) => {
      this.cardLoading[s] = true;
    });

    this.chartsReqSub?.unsubscribe();
    this.chartsReqSub = this.http
      .get<{ charts: Record<string, CardChart> }>(
        `${this.biHubBase}/api/kpis/page/${level}`,
        { params: { t: Date.now().toString() } }
      )
      .pipe(
        timeout(20000),
        catchError(() => {
          this.chartsError =
            'Hub BI indisponible — docker compose up -d mysql bi-hub puis FIX_BI_DASHBOARD.cmd';
          return of({ charts: {} as Record<string, CardChart> });
        }),
        finalize(() => {
          this.chartsLoading = false;
          slugs.forEach((s) => {
            this.cardLoading[s] = false;
          });
          this.lastUpdate = new Date();
          this.scheduleRenderCharts();
        })
      )
      .subscribe({
        next: (res) => {
          this.cardCharts = res.charts || {};
          const errors = Object.values(this.cardCharts).filter((c) => c.kind === 'error').length;
          if (errors > 0 && errors === slugs.length) {
            this.chartsError =
              'Entrepôt inaccessible — docker compose run --rm talend-etl puis F5';
          }
        },
      });
  }

  private scheduleRenderCharts(): void {
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
    }
    this.renderTimer = setTimeout(() => this.renderCharts(), 150);
  }

  private renderCharts(): void {
    this.destroyCharts();
    for (const card of this.pageCards) {
      const ch = this.chartFor(card.slug);
      if (!ch || ch.kind === 'error' || ch.kind === 'empty' || ch.kind === 'matrix') {
        continue;
      }
      const canvas = document.getElementById(`bi-chart-${card.slug}`) as HTMLCanvasElement | null;
      if (!canvas) {
        continue;
      }
      const cfg = this.buildChartConfig(card, ch);
      if (cfg) {
        this.chartInstances.set(card.slug, new Chart(canvas, cfg));
      }
    }
  }

  private buildChartConfig(
    card: BiManifestCard,
    ch: CardChart
  ): ChartConfiguration | null {
    const points = this.filteredPoints(card.slug);
    const labels = points.map((p) => this.shortLabel(p.label));
    const values = points.map((p) => p.value);
    const colors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

    if (ch.kind === 'gauge') {
      const rate = Math.min(100, Math.max(0, ch.scalar ?? 0));
      const breakdown = points.length
        ? { labels: labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] }
        : {
            labels: ['Taux', 'Reste'],
            datasets: [{ data: [rate, 100 - rate], backgroundColor: ['#5A3FC9', '#E2E8F0'], borderWidth: 0 }],
          };
      const doughnutCfg: ChartConfiguration<'doughnut'> = {
        type: 'doughnut',
        data: breakdown,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
            tooltip: { enabled: true },
          },
        },
      };
      return doughnutCfg;
    }

    if (ch.kind === 'line') {
      return {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: card.title,
              data: values,
              borderColor: '#5A3FC9',
              backgroundColor: 'rgba(90, 63, 201, 0.12)',
              fill: true,
              tension: 0.35,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: '#5A3FC9',
            },
          ],
        },
        options: this.defaultOptions(true),
      };
    }

    if (ch.kind === 'donut') {
      return {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } },
        },
      };
    }

    if (ch.kind === 'bar' || ch.kind === 'kpi') {
      return {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: card.title,
              data: values,
              backgroundColor: colors.map((c) => c + 'CC'),
              borderColor: colors,
              borderWidth: 1,
              borderRadius: 6,
            },
          ],
        },
        options: this.defaultOptions(false),
      };
    }

    return null;
  }

  private defaultOptions(indexAxisX: boolean): object {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 0 },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148, 163, 184, 0.2)' },
          ticks: { font: { size: 10 } },
        },
      },
    };
  }

  private shortLabel(label: string): string {
    if (label.length <= 12) {
      return label;
    }
    return label.slice(0, 10) + '…';
  }

  private destroyCharts(): void {
    this.chartInstances.forEach((c) => c.destroy());
    this.chartInstances.clear();
  }

  private checkBiHub(): void {
    const path = this.manifest?.biHub?.healthPath || '/api/health';
    const url = `${this.biHubBase}${path.startsWith('/') ? path : `/${path}`}`;
    this.http.get<HubHealth>(url).subscribe({
      next: (h) => {
        this.etlRunning = !!h.etlRunning;
        if (h.etlRunning) {
          this.etlMessage = 'Synchronisation en cours…';
        } else if (h.etlLastSuccess) {
          this.etlMessage = `Dernière synchro : ${this.formatTime(h.etlLastSuccess)}`;
        } else if (h.etlLastError) {
          this.etlMessage = `Erreur : ${h.etlLastError}`;
        }
        if (h.mysql && h.dw) {
          this.hubStatus = 'ok';
          this.hubDetail = `${this.manifest?.dwDatabase || 'findme_dw'} · ${h.dimDateRows ?? 0} périodes`;
        } else if (h.mysql) {
          this.hubStatus = 'degraded';
          this.hubDetail = 'Synchroniser pour alimenter les graphiques';
        } else {
          this.hubStatus = 'error';
          this.hubDetail = 'Docker MySQL arrêté';
        }
      },
      error: () => {
        this.hubStatus = 'error';
        this.hubDetail = 'docker compose up -d mysql bi-hub';
      },
    });
  }

  private formatTime(iso: string): string {
    try {
      return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
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

  private startEtlPolling(): void {
    this.etlPollSub?.unsubscribe();
    this.etlPollSub = interval(30000)
      .pipe(switchMap(() => this.http.get<HubHealth>(`${this.biHubBase}/api/health`)))
      .subscribe({
        next: (h) => {
          const was = this.etlRunning;
          this.etlRunning = !!h.etlRunning;
          if (was && !this.etlRunning) {
            this.loadHeadlineKpis();
            this.loadPageCharts(true);
          }
        },
      });
  }

  private startAutoRefresh(): void {
    this.refreshSub?.unsubscribe();
    this.refreshSub = interval(60000).subscribe(() => {
      if (this.autoRefresh && this.hubStatus === 'ok' && !this.etlRunning && this.manifest) {
        this.loadHeadlineKpis();
        this.loadPageCharts(true);
      }
    });
  }
}
