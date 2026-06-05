import { Component, OnDestroy, OnInit } from '@angular/core';
import Chart from 'chart.js/auto';
import { forkJoin } from 'rxjs';
import { AdminService, AdminUser } from '../../services/admin.service';
import { CvService } from '../../services/cv.service';
import { MissionService } from '../../services/mission';
import { CandidatureService } from '../../services/candidature';

type StatsSection = 'all' | 'users' | 'cvs' | 'offres' | 'candidatures';

interface GaugeItem {
  label: string;
  value: number;
  max: number;
  color: string;
}

@Component({
  selector: 'app-admin-stats',
  templateUrl: './admin-stats.component.html',
  styleUrls: ['./admin-stats.component.scss'],
})
export class AdminStatsComponent implements OnInit, OnDestroy {
  loading = false;
  errorMsg = '';

  section: StatsSection = 'all';
  dateFrom = '';
  dateTo = '';

  userRoleFilter = '';
  userStatusFilter = '';
  cvTypeFilter = '';
  offreStatusFilter = '';
  offreTypeFilter = '';
  candidatureStatusFilter = '';

  allUsers: AdminUser[] = [];
  allCvs: any[] = [];
  allOffres: any[] = [];
  allCandidatures: any[] = [];

  readonly roles = [
    'CANDIDAT', 'CHARGEDERECRUTEMENT', 'ESN_ADMIN', 'ESN_COMMERCIAL',
    'FREELANCER', 'INTERCONTRAT', 'ADMIN',
  ];
  readonly userStatuses = ['ACTIVE', 'INACTIVE', 'PENDING'];
  readonly cvTypes = ['Complet', 'En cours', 'Minimal'];
  readonly offreStatuses = ['OPEN', 'CLOSED'];
  readonly offreTypes = ['CDI', 'CDD', 'ALTERNANCE', 'PORTAGESALARIALE', 'MISSION_CDI', 'FREELANCE'];
  readonly candidatureStatuses = ['ENCOURS', 'ACCEPTER', 'REFUSER'];

  private charts: Chart[] = [];

  constructor(
    private adminService: AdminService,
    private cvService: CvService,
    private missionService: MissionService,
    private candidatureService: CandidatureService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  loadData(): void {
    this.loading = true;
    this.errorMsg = '';
    forkJoin({
      users: this.adminService.getAllUsers(),
      cvs: this.cvService.getAllCvs(),
      offres: this.missionService.getAllMissions(),
      candidatures: this.candidatureService.getAllCandidatures(),
    }).subscribe({
      next: (data) => {
        this.allUsers = data.users ?? [];
        this.allCvs = data.cvs ?? [];
        this.allOffres = data.offres ?? [];
        this.allCandidatures = data.candidatures ?? [];
        this.loading = false;
        setTimeout(() => this.renderCharts(), 100);
      },
      error: () => {
        this.errorMsg = 'Impossible de charger les statistiques.';
        this.loading = false;
      },
    });
  }

  setSection(section: StatsSection): void {
    this.section = section;
    setTimeout(() => this.renderCharts(), 50);
  }

  applyFilters(): void {
    setTimeout(() => this.renderCharts(), 50);
  }

  resetFilters(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.userRoleFilter = '';
    this.userStatusFilter = '';
    this.cvTypeFilter = '';
    this.offreStatusFilter = '';
    this.offreTypeFilter = '';
    this.candidatureStatusFilter = '';
    this.applyFilters();
  }

  get filteredUsers(): AdminUser[] {
    return this.allUsers.filter((u) => {
      const matchRole = !this.userRoleFilter || u.roleName === this.userRoleFilter;
      const matchStatus = !this.userStatusFilter || u.status === this.userStatusFilter;
      return matchRole && matchStatus;
    });
  }

  get filteredCvs(): any[] {
    return this.allCvs.filter((cv) => {
      const matchType = !this.cvTypeFilter || this.getCvType(cv) === this.cvTypeFilter;
      const matchDate = this.inDateRange(cv.createdAt);
      return matchType && matchDate;
    });
  }

  get filteredOffres(): any[] {
    return this.allOffres.filter((o) => {
      const status = o?.statusMission ?? '';
      const type = o?.descrip_mission?.typeContrat ?? 'INCONNU';
      const matchStatus = !this.offreStatusFilter || status === this.offreStatusFilter;
      const matchType = !this.offreTypeFilter || type === this.offreTypeFilter;
      const matchDate = this.inDateRange(o.createdAt);
      return matchStatus && matchType && matchDate;
    });
  }

  get filteredCandidatures(): any[] {
    return this.allCandidatures.filter((c) => {
      const status = c?.statutCandidature ?? '';
      const matchStatus = !this.candidatureStatusFilter || status === this.candidatureStatusFilter;
      const matchDate = this.inDateRange(c.datePostulation);
      return matchStatus && matchDate;
    });
  }

  get kpis() {
    const users = this.filteredUsers;
    const cvs = this.filteredCvs;
    const offres = this.filteredOffres;
    const candidatures = this.filteredCandidatures;
    const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
    const openOffres = offres.filter((o) => o.statusMission === 'OPEN').length;
    const accepted = candidatures.filter((c) => c.statutCandidature === 'ACCEPTER').length;
    return {
      totalUsers: users.length,
      activeUsers,
      totalCvs: cvs.length,
      totalOffres: offres.length,
      openOffres,
      totalCandidatures: candidatures.length,
      acceptedCandidatures: accepted,
    };
  }

  get gauges(): GaugeItem[] {
    const k = this.kpis;
    return [
      {
        label: 'Comptes actifs',
        value: k.activeUsers,
        max: Math.max(k.totalUsers, 1),
        color: '#10b981',
      },
      {
        label: 'Offres ouvertes',
        value: k.openOffres,
        max: Math.max(k.totalOffres, 1),
        color: '#5a3fc9',
      },
      {
        label: 'Candidatures acceptées',
        value: k.acceptedCandidatures,
        max: Math.max(k.totalCandidatures, 1),
        color: '#f59e0b',
      },
      {
        label: 'CV enregistrés',
        value: k.totalCvs,
        max: Math.max(k.totalCvs, k.totalUsers, 1),
        color: '#3b82f6',
      },
    ];
  }

  gaugePercent(g: GaugeItem): number {
    return Math.round((g.value / g.max) * 100);
  }

  gaugeGradient(g: GaugeItem): string {
    const pct = this.gaugePercent(g);
    return `conic-gradient(${g.color} 0% ${pct}%, #e5e7eb ${pct}% 100%)`;
  }

  countByKey<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const key = keyFn(item) || 'INCONNU';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  countByMonth(items: any[], dateField: string): Record<string, number> {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const raw = item[dateField];
      if (!raw) return;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return this.sortMonthCounts(counts);
  }

  getCvType(cv: any): string {
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
    };
    return map[role] ?? role;
  }

  private inDateRange(dateStr: string | null | undefined): boolean {
    if (!this.dateFrom && !this.dateTo) return true;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    if (this.dateFrom) {
      const from = new Date(this.dateFrom);
      if (d < from) return false;
    }
    if (this.dateTo) {
      const to = new Date(this.dateTo);
      to.setHours(23, 59, 59, 999);
      if (d > to) return false;
    }
    return true;
  }

  private sortMonthCounts(counts: Record<string, number>): Record<string, number> {
    return Object.fromEntries(
      Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))
    );
  }

  private destroyCharts(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];
  }

  private renderCharts(): void {
    this.destroyCharts();
    if (this.loading) return;

    if (this.showSection('users')) {
      this.renderDoughnut('chartUsersRole', 'Utilisateurs par rôle',
        this.countByKey(this.filteredUsers, (u) => u.roleName),
        ['#5a3fc9', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4']);
      this.renderBar('chartUsersStatus', 'Utilisateurs par statut',
        this.countByKey(this.filteredUsers, (u) => u.status),
        ['#10b981', '#ef4444', '#f59e0b']);
    }

    if (this.showSection('cvs')) {
      this.renderDoughnut('chartCvTypes', 'Types de CV (complétion)',
        this.countByKey(this.filteredCvs, (cv) => this.getCvType(cv)),
        ['#10b981', '#f59e0b', '#9ca3af']);
      this.renderLine('chartCvMonth', 'CV créés par mois',
        this.countByMonth(this.filteredCvs, 'createdAt'), '#3b82f6');
      this.renderBar('chartCvSteps', 'CV par nombre d\'étapes',
        this.countByKey(this.filteredCvs, (cv) => `${cv.completedSteps?.length ?? 0} étapes`),
        ['#5a3fc9', '#7367f0', '#3b82f6', '#06b6d4', '#10b981']);
    }

    if (this.showSection('offres')) {
      this.renderDoughnut('chartOffreStatus', 'Offres par statut',
        this.countByKey(this.filteredOffres, (o) => o.statusMission ?? 'INCONNU'),
        ['#10b981', '#ef4444']);
      this.renderBar('chartOffreType', 'Offres par type de contrat',
        this.countByKey(this.filteredOffres, (o) => o.descrip_mission?.typeContrat ?? 'INCONNU'),
        ['#5a3fc9', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4']);
      this.renderLine('chartOffreMonth', 'Offres publiées par mois',
        this.countByMonth(this.filteredOffres, 'createdAt'), '#5a3fc9');
    }

    if (this.showSection('candidatures')) {
      this.renderDoughnut('chartCandStatus', 'Candidatures par statut',
        this.countByKey(this.filteredCandidatures, (c) => c.statutCandidature ?? 'INCONNU'),
        ['#f59e0b', '#10b981', '#ef4444']);
      this.renderLine('chartCandMonth', 'Candidatures par mois',
        this.countByMonth(this.filteredCandidatures, 'datePostulation'), '#f59e0b');
    }
  }

  private renderDoughnut(
    canvasId: string,
    label: string,
    data: Record<string, number>,
    colors: string[]
  ): void {
    const el = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!el) return;
    const labels = Object.keys(data);
    const values = Object.values(data);
    if (labels.length === 0) return;

    const chart = new Chart(el, {
      type: 'doughnut',
      data: {
        labels: labels.map((l) => this.roleLabel(l) !== l ? this.roleLabel(l) : l),
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#fff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } },
          title: { display: true, text: label, font: { size: 14, weight: 'bold' } },
        },
      },
    });
    this.charts.push(chart);
  }

  private renderBar(
    canvasId: string,
    label: string,
    data: Record<string, number>,
    colors: string[]
  ): void {
    const el = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!el) return;
    const labels = Object.keys(data);
    const values = Object.values(data);
    if (labels.length === 0) return;

    const chart = new Chart(el, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label,
          data: values,
          backgroundColor: colors.slice(0, labels.length).map((c, i) => colors[i % colors.length]),
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: label, font: { size: 14, weight: 'bold' } },
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
      },
    });
    this.charts.push(chart);
  }

  private renderLine(
    canvasId: string,
    label: string,
    data: Record<string, number>,
    color: string
  ): void {
    const el = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!el) return;
    const labels = Object.keys(data);
    const values = Object.values(data);
    if (labels.length === 0) return;

    const chart = new Chart(el, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label,
          data: values,
          borderColor: color,
          backgroundColor: color + '33',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: color,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: label, font: { size: 14, weight: 'bold' } },
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
      },
    });
    this.charts.push(chart);
  }
}
