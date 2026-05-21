import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

export interface BiManifestCard {
  id: number;
  slug: string;
  title: string;
  domain: string;
  display: string;
  db: string;
  sqlFile?: string;
}

export interface BiManifestTab {
  key: string;
  label: string;
  cardSlugs: string[];
}

export interface BiPowerBiReport {
  level: string;
  name: string;
  file: string;
  description?: string;
}

export interface BiManifest {
  version: number;
  stack?: string;
  generatedAt: string | null;
  dwDatabase: string;
  talend?: { jobName: string; dockerService: string; buildId: string; studioPath?: string };
  powerBi?: {
    connection: { server: string; port: number; database: string; user: string; password: string };
    reports: BiPowerBiReport[];
    guidePath?: string;
  };
  dashboards?: BiPowerBiReport[];
  cards: BiManifestCard[];
  tabs: BiManifestTab[];
  credentials?: { mysqlReadOnlyUser?: string; mysqlReadOnlyPassword?: string };
}

@Component({
  selector: 'app-bi-dashboard',
  templateUrl: './bi-dashboard.component.html',
  styleUrls: ['./bi-dashboard.component.scss'],
})
export class BiDashboardComponent implements OnInit {
  manifest: BiManifest | null = null;
  manifestError = '';
  selectedTabKey = 'executive';
  selectedReportLevel = 'executive';
  showConnectionInfo = true;

  constructor(private http: HttpClient) {}

  get stackLabel(): string {
    return this.manifest?.stack || 'Talend ETL + Power BI';
  }

  get talendJob(): string {
    return this.manifest?.talend?.jobName || 'FindMe_Load_DW';
  }

  get reports(): BiPowerBiReport[] {
    return (
      this.manifest?.powerBi?.reports ||
      this.manifest?.dashboards ||
      []
    );
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

  get connection() {
    return this.manifest?.powerBi?.connection;
  }

  ngOnInit(): void {
    this.http
      .get<BiManifest>('/assets/bi/bi-manifest.json', { params: { t: Date.now().toString() } })
      .subscribe({
        next: (m) => {
          this.manifest = m;
          this.selectedTabKey = m.tabs?.[0]?.key || 'executive';
          this.selectedReportLevel = m.powerBi?.reports?.[0]?.level || 'executive';
        },
        error: () => {
          this.manifestError =
            'Manifest BI introuvable. Vérifiez find-me-front-2.1/src/assets/bi/bi-manifest.json';
        },
      });
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

  tierLabel(level: string): string {
    const map: Record<string, string> = {
      executive: 'Executive',
      managerial: 'Managérial',
      operational: 'Opérationnel',
    };
    return map[level] || level;
  }

  openPowerBiGuide(): void {
    window.open('https://aka.ms/pbidesktop', '_blank', 'noopener,noreferrer');
  }
}
