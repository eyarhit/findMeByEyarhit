import { Component, OnInit } from '@angular/core';
import { AdminService, AdminUser, AdminUserForm } from '../../services/admin.service';
import { CvService } from '../../services/cv.service';
import { MissionService } from '../../services/mission';
import { CandidatureService } from '../../services/candidature';

type AdminTab = 'users' | 'cvs' | 'offres' | 'candidatures';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
})
export class AdminPanelComponent implements OnInit {
  activeTab: AdminTab = 'users';
  loading = false;
  errorMsg = '';
  successMsg = '';

  users: AdminUser[] = [];
  cvs: any[] = [];
  offres: any[] = [];
  candidatures: any[] = [];

  userSearch = '';
  userRoleFilter = '';
  userStatusFilter = '';

  cvSearch = '';
  offreSearch = '';
  offreStatusFilter = '';
  candidatureSearch = '';
  candidatureStatusFilter = '';

  showUserModal = false;
  editingUser: AdminUser | null = null;
  userForm: AdminUserForm = this.emptyUserForm();

  readonly roles = [
    'CANDIDAT',
    'CHARGEDERECRUTEMENT',
    'ESN_ADMIN',
    'ESN_COMMERCIAL',
    'FREELANCER',
    'INTERCONTRAT',
    'ADMIN',
  ];

  readonly userStatuses = ['ACTIVE', 'INACTIVE', 'PENDING'];
  readonly offreStatuses = ['OPEN', 'CLOSED'];
  readonly candidatureStatuses = ['ENCOURS', 'ACCEPTER', 'REFUSER'];

  constructor(
    private adminService: AdminService,
    private cvService: CvService,
    private missionService: MissionService,
    private candidatureService: CandidatureService
  ) {}

  ngOnInit(): void {
    this.loadTabData('users');
  }

  setTab(tab: AdminTab): void {
    this.activeTab = tab;
    this.clearMessages();
    this.loadTabData(tab);
  }

  loadTabData(tab: AdminTab): void {
    this.loading = true;
    this.errorMsg = '';

    if (tab === 'users') {
      this.adminService.getAllUsers().subscribe({
        next: (data) => {
          this.users = data ?? [];
          this.loading = false;
        },
        error: () => {
          this.errorMsg = 'Impossible de charger les utilisateurs.';
          this.loading = false;
        },
      });
      return;
    }

    if (tab === 'cvs') {
      this.cvService.getAllCvs().subscribe({
        next: (data) => {
          this.cvs = data ?? [];
          this.loading = false;
        },
        error: () => {
          this.errorMsg = 'Impossible de charger les CV.';
          this.loading = false;
        },
      });
      return;
    }

    if (tab === 'offres') {
      this.missionService.getAllMissions().subscribe({
        next: (data) => {
          this.offres = data ?? [];
          this.loading = false;
        },
        error: () => {
          this.errorMsg = 'Impossible de charger les offres.';
          this.loading = false;
        },
      });
      return;
    }

    this.candidatureService.getAllCandidatures().subscribe({
      next: (data) => {
        this.candidatures = data ?? [];
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Impossible de charger les candidatures.';
        this.loading = false;
      },
    });
  }

  get filteredUsers(): AdminUser[] {
    const q = this.userSearch.trim().toLowerCase();
    return this.users.filter((u) => {
      const matchSearch =
        !q ||
        `${u.firstName} ${u.lastName} ${u.email} ${u.nomSociete ?? ''}`
          .toLowerCase()
          .includes(q);
      const matchRole = !this.userRoleFilter || u.roleName === this.userRoleFilter;
      const matchStatus = !this.userStatusFilter || u.status === this.userStatusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }

  get filteredCvs(): any[] {
    const q = this.cvSearch.trim().toLowerCase();
    return this.cvs.filter((cv) => {
      if (!q) return true;
      return `${cv.userId} ${cv.titreDeProfil ?? ''} ${cv.id_cv ?? ''}`
        .toLowerCase()
        .includes(q);
    });
  }

  get filteredOffres(): any[] {
    const q = this.offreSearch.trim().toLowerCase();
    return this.offres.filter((o) => {
      const name = o?.descrip_mission?.mission_name ?? '';
      const ville = o?.ville?.nom ?? '';
      const matchSearch =
        !q ||
        `${o.idMission} ${name} ${ville} ${o.user_id ?? ''}`.toLowerCase().includes(q);
      const status = o?.statusMission ?? '';
      const matchStatus = !this.offreStatusFilter || status === this.offreStatusFilter;
      return matchSearch && matchStatus;
    });
  }

  get filteredCandidatures(): any[] {
    const q = this.candidatureSearch.trim().toLowerCase();
    return this.candidatures.filter((c) => {
      const missionName = c?.mission?.descrip_mission?.mission_name ?? '';
      const matchSearch =
        !q ||
        `${c.idCandidature} ${c.candidatId} ${c.mission?.idMission ?? ''} ${missionName}`
          .toLowerCase()
          .includes(q);
      const status = c?.statutCandidature ?? '';
      const matchStatus =
        !this.candidatureStatusFilter || status === this.candidatureStatusFilter;
      return matchSearch && matchStatus;
    });
  }

  openCreateUser(): void {
    this.editingUser = null;
    this.userForm = this.emptyUserForm();
    this.showUserModal = true;
  }

  openEditUser(user: AdminUser): void {
    this.editingUser = user;
    this.userForm = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? '',
      role: user.roleName,
      status: user.status,
      nomSociete: user.nomSociete ?? '',
      country: user.country ?? '',
      password: '',
    };
    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.editingUser = null;
  }

  saveUser(): void {
    this.clearMessages();
    if (!this.userForm.firstName?.trim() || !this.userForm.lastName?.trim() || !this.userForm.email?.trim()) {
      this.errorMsg = 'Prénom, nom et email sont obligatoires.';
      return;
    }

    if (this.editingUser) {
      const payload: Partial<AdminUserForm> = { ...this.userForm };
      if (!payload.password) {
        delete payload.password;
      }
      this.adminService.updateUser(this.editingUser.userId, payload).subscribe({
        next: () => {
          this.successMsg = 'Utilisateur mis à jour.';
          this.closeUserModal();
          this.loadTabData('users');
        },
        error: (err) => {
          this.errorMsg = err?.error?.error ?? 'Erreur lors de la mise à jour.';
        },
      });
      return;
    }

    this.adminService.createUser(this.userForm).subscribe({
      next: () => {
        this.successMsg = 'Utilisateur créé.';
        this.closeUserModal();
        this.loadTabData('users');
      },
      error: (err) => {
        this.errorMsg = err?.error?.error ?? 'Erreur lors de la création.';
      },
    });
  }

  deleteUser(user: AdminUser): void {
    if (!confirm(`Supprimer ${user.firstName} ${user.lastName} ?`)) {
      return;
    }
    this.clearMessages();
    this.adminService.deleteUser(user.userId).subscribe({
      next: () => {
        this.successMsg = 'Utilisateur supprimé.';
        this.loadTabData('users');
      },
      error: () => {
        this.errorMsg = 'Erreur lors de la suppression.';
      },
    });
  }

  updateOffreStatus(offre: any, status: string): void {
    const payload = { ...offre, statusMission: status };
    this.missionService.updateMission(offre.idMission, payload).subscribe({
      next: () => {
        this.successMsg = 'Statut offre mis à jour.';
        this.loadTabData('offres');
      },
      error: () => {
        this.errorMsg = 'Erreur mise à jour statut offre.';
      },
    });
  }

  updateCandidatureStatus(candidature: any, status: string): void {
    this.candidatureService.updateCandidatureStatus(candidature.idCandidature, status).subscribe({
      next: () => {
        this.successMsg = 'Statut candidature mis à jour.';
        this.loadTabData('candidatures');
      },
      error: () => {
        this.errorMsg = 'Erreur mise à jour candidature.';
      },
    });
  }

  deleteCandidature(candidature: any): void {
    if (!confirm('Supprimer cette candidature ?')) {
      return;
    }
    this.candidatureService.deleteCandidature(candidature.idCandidature).subscribe({
      next: () => {
        this.successMsg = 'Candidature supprimée.';
        this.loadTabData('candidatures');
      },
      error: () => {
        this.errorMsg = 'Erreur suppression candidature.';
      },
    });
  }

  roleLabel(role: string): string {
    const map: Record<string, string> = {
      ESN_ADMIN: 'RH (ESN Admin)',
      ESN_COMMERCIAL: 'ESN Commercial',
      CHARGEDERECRUTEMENT: 'Chargé recrutement',
      CANDIDAT: 'Candidat',
      FREELANCER: 'Freelancer',
      INTERCONTRAT: 'Inter-contrat',
      ADMIN: 'Administrateur',
    };
    return map[role] ?? role;
  }

  private emptyUserForm(): AdminUserForm {
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'CANDIDAT',
      status: 'ACTIVE',
      nomSociete: '',
      country: '',
      password: '',
    };
  }

  private clearMessages(): void {
    this.errorMsg = '';
    this.successMsg = '';
  }
}
