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
  dateFrom = '';
  dateTo = '';

  userRoleFilter = '';
  userStatusFilter = '';
  cvTypeFilter = '';
  candidatureStatusFilter = '';

  allUsers: AdminUser[] = [];
  allCvs: any[] = [];
  allCandidatures: any[] = [];

  readonly roles = [
    'CANDIDAT', 'CHARGEDERECRUTEMENT', 'ESN_ADMIN', 'ESN_COMMERCIAL',
    'FREELANCER', 'INTERCONTRAT', 'ADMIN',
  ];
  readonly userStatuses = ['ACTIVE', 'INACTIVE', 'PENDING'];
  readonly cvTypes = ['Complet', 'En cours', 'Minimal'];
  readonly candidatureStatuses = ['ENCOURS', 'ACCEPTER', 'REFUSER'];

  readonly chartColors = [
    '#5a3fc9', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4',
  ];

  usersFiltered: AdminUser[] = [];
  cvsFiltered: any[] = [];
  candidaturesFiltered: any[] = [];

  usersByRole: Record<string, number> = {};
  usersByStatus: Record<string, number> = {};
  cvsByType: Record<string, number> = {};
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

  applyFilters(): void {
    this.recomputeStats();
  }

  resetFilters(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.userRoleFilter = '';
    this.userStatusFilter = '';
    this.cvTypeFilter = '';
    this.candidatureStatusFilter = '';
    this.recomputeStats();
  }

  showSection(s: StatsSection): boolean {
    return this.section === 'all' || this.section === s;
  }

  roleLabel(role: string): string {
    const map: Record<string, string> = {
      ESN_ADMIN: 'RH',
      ESN_COMMERCIAL: 'ESN Commercial',
      CHARGEDERECRUTEMENT: 'Chargé recrutement',
      CANDIDAT: 'Candidat',
      FREELANCER: 'Freelancer',
      INTERCONTRAT: 'Inter-contrat',
      ADMIN: 'Admin',
      ENCOURS: 'En cours',
      ACCEPTER: 'Acceptée',
      REFUSER: 'Refusée',
      ACTIVE: 'Actif',
      INACTIVE: 'Inactif',
      PENDING: 'En attente',
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
    this.usersFiltered = this.allUsers.filter((u) => {
      const matchRole = !this.userRoleFilter || u.roleName === this.userRoleFilter;
      const matchStatus = !this.userStatusFilter || u.status === this.userStatusFilter;
      return matchRole && matchStatus;
    });

    this.cvsFiltered = this.allCvs.filter((cv) => {
      const matchType = !this.cvTypeFilter || this.getCvType(cv) === this.cvTypeFilter;
      const matchDate = this.inDateRange(cv.createdAt);
      return matchType && matchDate;
    });

    this.candidaturesFiltered = this.allCandidatures.filter((c) => {
      const status = c?.statutCandidature ?? '';
      const matchStatus = !this.candidatureStatusFilter || status === this.candidatureStatusFilter;
      const matchDate = this.inDateRange(c.datePostulation);
      return matchStatus && matchDate;
    });

    this.usersByRole = this.countByKey(this.usersFiltered, (u) => u.roleName);
    this.usersByStatus = this.countByKey(this.usersFiltered, (u) => u.status);
    this.cvsByType = this.countByKey(this.cvsFiltered, (cv) => this.getCvType(cv));
    this.candidaturesByStatus = this.countByKey(
      this.candidaturesFiltered,
      (c) => c.statutCandidature ?? 'INCONNU'
    );

    this.totalUsers = this.usersFiltered.length;
    this.activeUsers = this.usersFiltered.filter((u) => u.status === 'ACTIVE').length;
    this.totalCvs = this.cvsFiltered.length;
    this.totalCandidatures = this.candidaturesFiltered.length;
    this.acceptedCandidatures = this.candidaturesFiltered.filter(
      (c) => c.statutCandidature === 'ACCEPTER'
    ).length;
  }

  private getCvType(cv: any): string {
    const steps = cv.completedSteps?.length ?? 0;
    const hasContent =
      (cv.competences?.length > 0) ||
      (cv.experiences?.length > 0) ||
      (cv.educations?.length > 0) ||
      !!cv.titreDeProfil;
    if (steps >= 5 || (hasContent && steps >= 3)) return 'Complet';
    if (hasContent || steps > 0) return 'En cours';
    return 'Minimal';
  }

  private countByKey<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const key = keyFn(item) || 'INCONNU';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  private inDateRange(dateStr: string | null | undefined): boolean {
    if (!this.dateFrom && !this.dateTo) return true;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    if (this.dateFrom && d < new Date(this.dateFrom)) return false;
    if (this.dateTo) {
      const to = new Date(this.dateTo);
      to.setHours(23, 59, 59, 999);
      if (d > to) return false;
    }
    return true;
  }
}
