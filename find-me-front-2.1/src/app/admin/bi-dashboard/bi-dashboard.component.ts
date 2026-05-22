import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface BiManifestCard {
  id: number;
  slug: string;
  title: string;
  domain: string;
  display: string;
  db: string;
  sqlFile?: string;
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
  file?: string;
  description?: string;
}

export interface BiHubLinks {
  port: number;
  baseUrl: string;
  talendUrl: string;
  powerBiUrl: string;
  talendStudioUrl?: string;
  powerBiWebUrl?: string;
  healthUrl: string;
}

export interface BiManifest {
  version: number;
  stack?: string;
  generatedAt: string | null;
  dwDatabase: string;
  githubRepo?: string;
  biHub?: BiHubLinks;
  talend?: {
    jobName: string;
    dockerService: string;
    hubService?: string;
    etlCommand?: string;
    studioPath?: string;
  };
  powerBi?: {
    pbipProject?: string;
    openCommandWin?: string;
    friendCommandWin?: string;
    fixPage04Command?: string;
    connectionHint?: string;
    guidePaths?: string[];
    reports: BiPowerBiReport[];
  };
  adminWorkflow?: string[];
  friendWorkflow?: string[];
  cards: BiManifestCard[];
  tabs: BiManifestTab[];
}

interface HubHealth {
  status: string;
  mysql: boolean;
  dw: boolean;
  dimDateRows?: number;
  etlRunning?: boolean;
  etlLastSuccess?: string | null;
  etlLastError?: string | null;
  error?: string | null;
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
  selectedTabKey = 'executive';
  selectedReportLevel = 'executive';
  showConnectionInfo = false;
  showFriendGuide = false;

  executiveKpis: ExecutiveKpis | null = null;
  dwStats: Record<string, number> = {};
  etlRunning = false;
  etlMessage = '';
  etlPollSub?: Subscription;

  constructor(private http: HttpClient) {}

  get stackLabel(): string {
    return this.manifest?.stack || 'Talend ETL → Power BI';
  }

  get talendJob(): string {
    return this.manifest?.talend?.jobName || 'FindMe_Load_DW';
  }

  get reports(): BiPowerBiReport[] {
    return this.manifest?.powerBi?.reports || [];
  }

  get selectedReport(): BiPowerBiReport | undefined {
    return this.reports.find((r) => r.level === this.selectedReportLevel) || this.reports[0];
  }

  get tabs(): BiManifestTab[] {
    return this.manifest?.tabs?.length ? this.manifest.tabs : [];
  }

  get selectedTab(): BiManifestTab {
    return this.tabs.find((t) => t.key === this.selectedTabKey) || this.tabs[0];
  }

  get selectedCards(): BiManifestCard[] {
    const slugs = new Set(this.selectedTab?.cardSlugs || []);
    return (this.manifest?.cards || []).filter((c) => slugs.has(c.slug));
  }

  get pbipPath(): string {
    return this.manifest?.powerBi?.pbipProject || 'bi/powerbi/FindMe-Dashboard/FindMe-Dashboard.pbip';
  }

  get biHubBase(): string {
    const port = this.manifest?.biHub?.port ?? 3032;
    return `http://${window.location.hostname}:${port}`;
  }

  get talendStudioUrl(): string {
    const h = window.location.hostname;
    const port = this.manifest?.biHub?.talendStudioUrl
      ? new URL(this.manifest.biHub.talendStudioUrl).port || '6080'
      : '6080';
    return (
      this.manifest?.biHub?.talendStudioUrl?.replace('localhost', h) ||
      `http://${h}:${port}`
    );
  }

  get powerBiWebUrl(): string {
    const h = window.location.hostname;
    return (
      this.manifest?.biHub?.powerBiWebUrl?.replace('localhost', h) ||
      `http://${h}:8077/reports`
    );
  }

  get biHubLauncherUrl(): string {
    return `${this.biHubBase}/?tab=talend`;
  }

  ngOnInit(): void {
    this.http
      .get<BiManifest>('/assets/bi/bi-manifest.json', {
        params: { t: Date.now().toString() },
      })
      .subscribe({
        next: (m) => {
          this.manifest = m;
          this.selectedTabKey = m.tabs?.[0]?.key || 'executive';
          this.selectedReportLevel = m.powerBi?.reports?.[0]?.level || 'executive';
          this.refreshHubData();
          this.startEtlPolling();
        },
        error: () => {
          this.manifestError =
            'Manifest BI introuvable (assets/bi/bi-manifest.json).';
        },
      });
  }

  ngOnDestroy(): void {
    this.etlPollSub?.unsubscribe();
  }

  selectTab(key: string): void {
    this.selectedTabKey = key;
  }

  selectReportLevel(level: string): void {
    this.selectedReportLevel = level;
  }

  toggleConnectionInfo(): void {
    this.showConnectionInfo = !this.showConnectionInfo;
  }

  toggleFriendGuide(): void {
    this.showFriendGuide = !this.showFriendGuide;
  }

  tierLabel(level: string): string {
    const map: Record<string, string> = {
      executive: 'Executive',
      managerial: 'Managerial',
      operational: 'Operationnel',
      technique: 'Technique',
    };
    return map[level] || level;
  }

  openTalendStudio(): void {
    window.open(this.talendStudioUrl, '_blank', 'noopener,noreferrer');
  }

  openPowerBiWeb(): void {
    window.open(this.powerBiWebUrl, '_blank', 'noopener,noreferrer');
  }

  openBiHub(): void {
    window.open(this.biHubLauncherUrl, '_blank', 'noopener,noreferrer');
  }

  openGithub(): void {
    const url = this.manifest?.githubRepo || 'https://github.com/eyarhit/findMeByEyarhit';
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  runEtl(): void {
    this.etlMessage = 'Démarrage ETL Talend…';
    this.http.post<{ started: boolean }>(`${this.biHubBase}/api/etl/run`, {}).subscribe({
      next: () => {
        this.etlRunning = true;
        this.etlMessage = 'ETL en cours (findme_dw)…';
        this.refreshHubData();
      },
      error: (err) => {
        this.etlMessage =
          err?.status === 409
            ? 'ETL déjà en cours.'
            : 'Hub BI indisponible — lancez : docker compose up -d bi-hub mysql';
      },
    });
  }

  hubStatusLabel(): string {
    const map: Record<string, string> = {
      ok: 'Entrepôt prêt · Power BI peut actualiser',
      degraded: 'MySQL OK — lancer l’ETL Talend',
      error: 'Hub BI / Docker indisponible (port 3032)',
      unknown: 'Vérification…',
    };
    return map[this.hubStatus] || map['unknown'];
  }

  dwStatsEntries(): { name: string; count: number }[] {
    return Object.entries(this.dwStats).map(([name, count]) => ({ name, count }));
  }

  private refreshHubData(): void {
    this.checkBiHub();
    this.loadExecutiveKpis();
    this.loadDwStats();
  }

  private checkBiHub(): void {
    const url = this.manifest?.biHub?.healthUrl || `${this.biHubBase}/api/health`;
    this.http.get<HubHealth>(url).subscribe({
      next: (h) => {
        this.etlRunning = !!h.etlRunning;
        if (h.etlRunning) {
          this.etlMessage = 'ETL en cours…';
        } else if (h.etlLastSuccess) {
          this.etlMessage = `Dernier ETL OK : ${h.etlLastSuccess}`;
        } else if (h.etlLastError) {
          this.etlMessage = `Dernière erreur ETL : ${h.etlLastError}`;
        }
        if (h.mysql && h.dw) {
          this.hubStatus = 'ok';
          this.hubDetail = `${h.dimDateRows ?? 0} dates · findme_dw`;
        } else if (h.mysql) {
          this.hubStatus = 'degraded';
          this.hubDetail = 'Lancer Talend ETL';
        } else {
          this.hubStatus = 'error';
          this.hubDetail = h.error || 'MySQL inaccessible';
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

  private startEtlPolling(): void {
    this.etlPollSub?.unsubscribe();
    this.etlPollSub = interval(8000)
      .pipe(switchMap(() => this.http.get<HubHealth>(`${this.biHubBase}/api/health`)))
      .subscribe({
        next: (h) => {
          const was = this.etlRunning;
          this.etlRunning = !!h.etlRunning;
          if (was && !this.etlRunning && h.etlLastSuccess) {
            this.etlMessage = `ETL terminé : ${h.etlLastSuccess}`;
            this.loadExecutiveKpis();
            this.loadDwStats();
            this.checkBiHub();
          }
        },
      });
  }
}
