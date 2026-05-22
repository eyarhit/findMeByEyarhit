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

interface MoisPoint {
  label: string;
  value: number;
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
  candidaturesMois: MoisPoint[] = [];
  dwStats: Record<string, number> = {};
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
      const dates = this.dwStats['dim_date'] ?? 0;
      const users = this.dwStats['dim_user'] ?? 0;
      return [
        { label: 'Dates DW', value: dates },
        { label: 'Utilisateurs DW', value: users },
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

    this.routeSub = this.route.paramMap.subscribe(() => this.bindRouteNiveau());
  }

  ngOnDestroy(): void {
    this.etlPollSub?.unsubscribe();
    this.routeSub?.unsubscribe();
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
            : 'Service BI indisponible (docker compose up -d bi-hub mysql).';
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

  displayIcon(type: string): string {
    const t = (type || '').toLowerCase();
    if (t.includes('line')) return 'chart-line';
    if (t.includes('bar') || t.includes('histogram')) return 'chart-bar';
    if (t.includes('donut') || t.includes('pie')) return 'chart-pie';
    if (t.includes('gauge') || t.includes('kpi') || t.includes('matrix')) return 'gauge';
    if (t.includes('table')) return 'table';
    return 'chart';
  }

  maxMoisValue(): number {
    return Math.max(1, ...this.candidaturesMois.map((p) => p.value));
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
    this.loadCandidaturesMois();
    this.loadPbiConnection();
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

  private loadCandidaturesMois(): void {
    this.http
      .get<MoisPoint[]>(`${this.biHubBase}/api/kpis/candidatures_par_mois`)
      .subscribe({
        next: (rows) => (this.candidaturesMois = rows || []),
        error: () => (this.candidaturesMois = []),
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
    this.etlPollSub = interval(8000)
      .pipe(switchMap(() => this.http.get<HubHealth>(`${this.biHubBase}/api/health`)))
      .subscribe({
        next: (h) => {
          const was = this.etlRunning;
          this.etlRunning = !!h.etlRunning;
          if (was && !this.etlRunning && h.etlLastSuccess) {
            this.etlMessage = `Synchronisation terminée : ${h.etlLastSuccess}`;
            this.refreshHubData();
          }
        },
      });
  }
}
