import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

export interface BiReport {
  level: string;
  name: string;
  file: string;
  pages: string[];
}

export interface BiManifest {
  version: number;
  stack: string;
  generatedAt: string | null;
  problematic?: string;
  powerBiGuideUrl: string;
  mysql: { host: string; port: number; database: string; user: string; passwordHint?: string };
  etl: { tool: string; jobName: string; dockerService: string; command: string };
  reports: BiReport[];
  dimensions: { temps: string; localisation: string; utilisateur: string; mission: string };
  credentials?: { mysqlReadOnlyUser?: string; powerBiNote?: string };
}

@Component({
  selector: 'app-bi-dashboard',
  templateUrl: './bi-dashboard.component.html',
  styleUrls: ['./bi-dashboard.component.scss'],
})
export class BiDashboardComponent implements OnInit {
  manifest: BiManifest | null = null;
  manifestError = '';
  showConnectionInfo = false;
  selectedReportLevel = 'executive';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<BiManifest>('/assets/bi/bi-manifest.json').subscribe({
      next: (m) => {
        this.manifest = m;
        if (m.reports?.length) {
          this.selectedReportLevel = m.reports[0].level;
        }
      },
      error: () => {
        this.manifestError =
          'Manifest BI introuvable. Lancez : docker compose run --rm powerbi-seed';
      },
    });
  }

  get reports(): BiReport[] {
    return this.manifest?.reports ?? [];
  }

  get selectedReport(): BiReport | undefined {
    return this.reports.find((r) => r.level === this.selectedReportLevel);
  }

  get guideUrl(): string {
    return this.manifest?.powerBiGuideUrl ?? 'http://localhost:8088';
  }

  tierLabel(level: string): string {
    const map: Record<string, string> = {
      executive: 'Executive',
      managerial: 'Managérial',
      operational: 'Opérationnel',
    };
    return map[level] ?? level;
  }

  openGuide(): void {
    window.open(this.guideUrl, '_blank', 'noopener,noreferrer');
  }

  toggleConnectionInfo(): void {
    this.showConnectionInfo = !this.showConnectionInfo;
  }

  selectReport(level: string): void {
    this.selectedReportLevel = level;
  }
}
