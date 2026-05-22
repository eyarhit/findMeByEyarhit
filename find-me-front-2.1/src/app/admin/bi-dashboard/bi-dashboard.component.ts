import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface BiManifestCard {
  id: number;
  slug: string;
  title: string;
  commercialTitle?: string;
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
    openCommandWin?: string;
    openDesktopAsset?: string;
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
  title?: string;
  kind: string;
  points: ChartPoint[];
  scalars: Record<string, number>;
  scalarLabels?: Record<string, string>;
  scalar: number | null;
  gaugeLabel?: string;
  error?: string;
}

interface BiFilterDef {
  id: string;
  label: string;
}

interface FilterOption {
  value: string;
  label: string;
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
  etlRunning = false;
  etlMessage = '';
  pbiOpenHint = '';

  filterDefs: BiFilterDef[] = [];
  filterOptions: Record<string, FilterOption[]> = {};
  activeFilters: Record<string, string> = {};

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
        { label: 'Missions ouvertes', value: this.executiveKpis.total_missions ?? 0 },
        { label: 'Candidatures', value: this.executiveKpis.total_candidatures ?? 0 },
        { label: 'CV actifs', value: this.executiveKpis.total_cv ?? 0 },
      ];
    }
    if (this.selectedReportLevel === 'technique') {
      return [
        { label: 'Périodes', value: this.dwStats['dim_date'] ?? 0 },
        { label: 'Profils', value: this.dwStats['dim_user'] ?? 0 },
        { label: 'Candidatures', value: this.dwStats['fact_candidature'] ?? 0 },
        { label: 'CV', value: this.dwStats['fact_cv'] ?? 0 },
      ];
    }
    const keys = ['fact_candidature', 'fact_mission', 'fact_user', 'fact_cv'] as const;
    const labels = ['Candidatures', 'Missions', 'Activité', 'CV'];
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
            'Tableau de bord indisponible. Relancez la plateforme puis actualisez la page.';
        },
      });

    this.routeSub = this.route.paramMap.subscribe(() => {
      this.bindRouteNiveau();
      if (this.manifest) {
        this.loadFilters();
        this.loadPageCharts();
      }
    });
  }

  ngOnDestroy(): void {
    this.etlPollSub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }

  cardTitle(card: BiManifestCard): string {
    const ch = this.chartFor(card.slug);
    return ch?.title || card.commercialTitle || card.title.replace(/\s*\([^)]*\)\s*/g, '').trim();
  }

  chartFor(slug: string): CardChart | undefined {
    return this.cardCharts[slug];
  }

  maxChartValue(slug: string): number {
    const pts = this.chartFor(slug)?.points || [];
    return Math.max(1, ...pts.map((p) => p.value));
  }

  barHeight(slug: string, value: number): number {
    if (value <= 0) return 0;
    return Math.max(14, (value / this.maxChartValue(slug)) * 100);
  }

  donutTotal(slug: string): number {
    const pts = this.chartFor(slug)?.points || [];
    return pts.reduce((s, p) => s + p.value, 0) || 1;
  }

  scalarKeys(slug: string): string[] {
    return Object.keys(this.chartFor(slug)?.scalars || {});
  }

  scalarLabel(slug: string, key: string): string {
    const ch = this.chartFor(slug);
    return ch?.scalarLabels?.[key] || key.replace(/_/g, ' ');
  }

  linePolyline(slug: string): string {
    const pts = this.chartFor(slug)?.points || [];
    if (pts.length < 2) return '';
    const w = 200;
    const h = 70;
    const max = this.maxChartValue(slug);
    return pts
      .map((p, i) => {
        const x = (i / (pts.length - 1)) * w;
        const y = h - (p.value / max) * h;
        return `${x},${y}`;
      })
      .join(' ');
  }

  onFilterChange(filterId: string, value: string): void {
    if (value) {
      this.activeFilters[filterId] = value;
    } else {
      delete this.activeFilters[filterId];
    }
    this.loadPageCharts();
  }

  selectReportLevel(level: string): void {
    this.router.navigate(['/utilisateur/bi', level]);
  }

  runEtl(): void {
    this.etlMessage = 'Mise à jour des indicateurs en cours…';
    this.http.post(`${this.biHubBase}/api/etl/run`, {}).subscribe({
      next: () => {
        this.etlRunning = true;
        this.etlMessage = 'Synchronisation en cours…';
      },
      error: (err) => {
        this.etlMessage =
          err?.status === 409
            ? 'Une synchronisation est déjà en cours.'
            : 'Service indisponible — redémarrez la plateforme (Docker).';
      },
    });
  }

  openPowerBiDesktop(): void {
    const asset =
      this.manifest?.powerBi?.openDesktopAsset || 'assets/bi/Ouvrir-PowerBI-Desktop.cmd';
    const a = document.createElement('a');
    a.href = asset;
    a.download = 'Ouvrir-PowerBI-Desktop.cmd';
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.pbiOpenHint =
      'Fichier téléchargé : double-cliquez Ouvrir-PowerBI-Desktop.cmd (ou lancez ONE_COMMANDE_POWERBI.cmd à la racine du projet).';
  }

  hubStatusLabel(): string {
    const map: Record<string, string> = {
      ok: 'Indicateurs à jour',
      degraded: 'Données à rafraîchir',
      error: 'Service indisponible',
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
    this.loadFilters();
    this.loadPageCharts();
  }

  private loadFilters(): void {
    this.http
      .get<{ filters: BiFilterDef[]; options: Record<string, FilterOption[]> }>(
        `${this.biHubBase}/api/kpis/filters/${this.selectedReportLevel}`
      )
      .subscribe({
        next: (res) => {
          this.filterDefs = res.filters || [];
          this.filterOptions = res.options || {};
          if (!this.activeFilters['year'] && this.filterOptions['year']?.length) {
            this.activeFilters['year'] = this.filterOptions['year'][0].value;
          }
        },
      });
  }

  private loadPageCharts(): void {
    if (!this.manifest) return;
    this.chartsLoading = true;
    this.chartsError = '';
    let params = new HttpParams().set('t', Date.now().toString());
    Object.entries(this.activeFilters).forEach(([k, v]) => {
      if (v) params = params.set(k, v);
    });
    this.http
      .get<{ charts: Record<string, CardChart> }>(
        `${this.biHubBase}/api/kpis/page/${this.selectedReportLevel}`,
        { params }
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
            'Graphiques indisponibles. Reconstruisez bi-hub : docker compose build bi-hub && docker compose up -d bi-hub';
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
          this.etlMessage = `Dernière mise à jour : ${this.formatSyncDate(h.etlLastSuccess)}`;
        } else if (h.etlLastError) {
          this.etlMessage = `Échec de synchronisation : ${h.etlLastError}`;
        } else {
          this.etlMessage = '';
        }
        if (h.mysql && h.dw) {
          this.hubStatus = 'ok';
          this.hubDetail = `${h.dimDateRows ?? 0} périodes analysées`;
        } else if (h.mysql) {
          this.hubStatus = 'degraded';
          this.hubDetail = 'Cliquez sur Synchroniser les données';
        } else {
          this.hubStatus = 'error';
          this.hubDetail = 'Plateforme non démarrée';
        }
      },
      error: () => {
        this.hubStatus = 'error';
        this.hubDetail = 'Démarrez Docker (mysql + bi-hub)';
      },
    });
  }

  private formatSyncDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString('fr-FR');
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
    this.etlPollSub = interval(5000)
      .pipe(switchMap(() => this.http.get<HubHealth>(`${this.biHubBase}/api/health`)))
      .subscribe({
        next: (h) => {
          const was = this.etlRunning;
          this.etlRunning = !!h.etlRunning;
          if (was && !this.etlRunning) {
            if (h.etlLastSuccess) {
              this.etlMessage = `Mise à jour terminée : ${this.formatSyncDate(h.etlLastSuccess)}`;
            }
            this.refreshHubData();
          }
        },
      });
  }
}
