import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AdminService, AdminUser } from '../../services/admin.service';
import { CvService } from '../../services/cv.service';
import { CandidatureService } from '../../services/candidature';

type StatsSection = 'all' | 'users' | 'cvs' | 'candidatures';

@Component({
  selector: 'app-admin-stats',
  templateUrl: './admin-stats.component.html',
  styleUrls: ['./admin-stats.component.scss'],
})
export class AdminStatsComponent implements OnInit {
  loading = false;
  errorMsg = '';

  section: StatsSection = 'all';

  allUsers: AdminUser[] = [];
  allCvs: any[] = [];
  allCandidatures: any[] = [];

  readonly chartColors = [
    '#5a3fc9', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4',
  ];

  usersByRole: Record<string, number> = {};
  usersByStatus: Record<string, number> = {};
  /** CDI / CDD — dérivé des candidatures liées aux offres */
  cvsByContrat: Record<string, number> = { CDI: 0, CDD: 0 };
  candidaturesByStatus: Record<string, number> = {};

  totalUsers = 0;
  activeUsers = 0;
  totalCvs = 0;
  totalCandidatures = 0;
  acceptedCandidatures = 0;

  constructor(
    private adminService: AdminService,
    private cvService: CvService,
    private candidatureService: CandidatureService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMsg = '';
    forkJoin({
      users: this.adminService.getAllUsers(),
      cvs: this.cvService.getAllCvs(),
      candidatures: this.candidatureService.getAllCandidatures(),
    }).subscribe({
      next: (data) => {
        this.allUsers = data.users ?? [];
        this.allCvs = data.cvs ?? [];
        this.allCandidatures = data.candidatures ?? [];
        this.loading = false;
        this.recomputeStats();
      },
      error: () => {
        this.errorMsg = 'Impossible de charger les statistiques.';
        this.loading = false;
      },
    });
  }

  setSection(section: StatsSection): void {
    this.section = section;
  }

  showSection(s: StatsSection): boolean {
    return this.section === 'all' || this.section === s;
  }

  roleLabel(role: string): string {
    const map: Record<string, string> = {
      ESN_ADMIN: 'RH',
      CANDIDAT: 'Candidat',
      ADMIN: 'Admin',
      ENCOURS: 'En cours',
      ACCEPTER: 'Acceptée',
      REFUSER: 'Refusée',
      ACTIVE: 'Actif',
      INACTIVE: 'Inactif',
      PENDING: 'En attente',
      CDI: 'CDI',
      CDD: 'CDD',
    };
    return map[role] ?? role;
  }

  getConicGradient(data: Record<string, number>): string {
    const entries = Object.entries(data);
    const total = entries.reduce((sum, [, v]) => sum + v, 0);
    if (total === 0) return 'conic-gradient(#e5e7eb 0% 100%)';

    let gradient = '';
    let current = 0;
    entries.forEach(([, value], index) => {
      const pct = (value / total) * 100;
      gradient += `${this.chartColors[index % this.chartColors.length]} ${current}% ${current + pct}%, `;
      current += pct;
    });
    return `conic-gradient(${gradient.slice(0, -2)})`;
  }

  barPercent(value: number, data: Record<string, number>): number {
    const max = Math.max(...Object.values(data), 1);
    return Math.round((value / max) * 100);
  }

  pieTotal(data: Record<string, number>): number {
    return Object.values(data).reduce((a, b) => a + b, 0);
  }

  piePercent(value: number, data: Record<string, number>): string {
    const total = this.pieTotal(data);
    if (total === 0) return '0';
    return ((value / total) * 100).toFixed(1);
  }

  legendColor(index: number): string {
    return this.chartColors[index % this.chartColors.length];
  }

  objectKeys(data: Record<string, number>): string[] {
    return Object.keys(data);
  }

  private recomputeStats(): void {
    this.usersByRole = this.countByKey(this.allUsers, (u) => u.roleName);
    this.usersByStatus = this.countByKey(this.allUsers, (u) => u.status);

    this.cvsByContrat = { CDI: 0, CDD: 0 };
    this.allCandidatures.forEach((c) => {
      const type = c?.mission?.descrip_mission?.typeContrat;
      if (type === 'CDI' || type === 'CDD') {
        this.cvsByContrat[type] = (this.cvsByContrat[type] || 0) + 1;
      }
    });

    this.candidaturesByStatus = this.countByKey(
      this.allCandidatures,
      (c) => c.statutCandidature ?? 'INCONNU'
    );

    this.totalUsers = this.allUsers.length;
    this.activeUsers = this.allUsers.filter((u) => u.status === 'ACTIVE').length;
    this.totalCvs = this.allCvs.length;
    this.totalCandidatures = this.allCandidatures.length;
    this.acceptedCandidatures = this.allCandidatures.filter(
      (c) => c.statutCandidature === 'ACCEPTER'
    ).length;
  }

  private countByKey<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const key = keyFn(item) || 'INCONNU';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }
}
