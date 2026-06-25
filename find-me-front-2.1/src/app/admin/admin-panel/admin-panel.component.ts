import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminService, AdminUser } from '../../services/admin.service';
import { CvService } from '../../services/cv.service';
import { MissionService } from '../../services/mission';
import { CandidatureService } from '../../services/candidature';
import { AppValidators } from '../../shared/validators/app-validators';
import { Cv } from '../../_model/Cv';

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

  cvSearch = '';
  offreSearch = '';
  candidatureSearch = '';
  candidatureStatusFilter = '';

  showUserModal = false;
  editingUser: AdminUser | null = null;
  userFormGroup!: FormGroup;

  showCvModal = false;
  editingCv: Cv | null = null;
  cvFormGroup!: FormGroup;
  cvSaving = false;

  /** Rôles utilisés dans l'application : Candidat, RH, Admin */
  readonly roles = ['CANDIDAT', 'ESN_ADMIN', 'ADMIN'];
  readonly candidatureStatuses = ['ENCOURS', 'ACCEPTER', 'REFUSER'];

  constructor(
    private adminService: AdminService,
    private cvService: CvService,
    private missionService: MissionService,
    private candidatureService: CandidatureService,
    private fb: FormBuilder
  ) {
    this.userFormGroup = this.buildUserForm();
    this.cvFormGroup = this.buildCvForm();
  }

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
      forkJoin({
        cvs: this.cvService.getAllCvs(),
        users: this.adminService.getAllUsers(),
      }).subscribe({
        next: ({ cvs, users }) => {
          this.cvs = cvs ?? [];
          this.users = users ?? [];
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
      return matchSearch && matchRole;
    });
  }

  get filteredCvs(): any[] {
    const q = this.cvSearch.trim().toLowerCase();
    return this.cvs.filter((cv) => {
      if (!q) return true;
      return `${this.getCvName(cv)} ${this.getCandidateName(cv)} ${cv.titreDeProfil ?? ''}`
        .toLowerCase()
        .includes(q);
    });
  }

  getCvName(cv: { titreDeProfil?: string }): string {
    const title = cv.titreDeProfil?.trim();
    return title || '—';
  }

  getCandidateName(cv: { userId?: number }): string {
    const user = this.users.find((u) => u.userId === cv.userId);
    if (!user) {
      return '—';
    }
    return `${user.firstName} ${user.lastName}`.trim();
  }

  openEditCv(cv: { id_cv?: number; userId?: number; titreDeProfil?: string }): void {
    if (!cv.userId) {
      this.errorMsg = 'Candidat introuvable pour ce CV.';
      return;
    }
    this.clearMessages();
    this.cvService.getCvByUserId(cv.userId).subscribe({
      next: (fullCv) => {
        if (!fullCv) {
          this.errorMsg = 'CV introuvable.';
          return;
        }
        this.editingCv = fullCv;
        this.cvFormGroup = this.buildCvForm({
          titreDeProfil: fullCv.titreDeProfil ?? '',
          candidateName: this.getCandidateName(fullCv),
        });
        this.showCvModal = true;
      },
      error: () => {
        this.errorMsg = 'Impossible de charger le CV.';
      },
    });
  }

  closeCvModal(): void {
    this.showCvModal = false;
    this.editingCv = null;
    this.cvFormGroup.reset();
  }

  saveCv(): void {
    if (!this.editingCv?.id_cv || !this.editingCv.userId) {
      return;
    }
    this.clearMessages();
    this.cvFormGroup.markAllAsTouched();
    if (this.cvFormGroup.invalid) {
      this.errorMsg = 'Veuillez corriger les champs en rouge avant d’enregistrer.';
      return;
    }

    const titreDeProfil = String(this.cvFormGroup.getRawValue().titreDeProfil ?? '').trim();
    const payload: Cv = {
      ...this.editingCv,
      titreDeProfil,
      competences: this.editingCv.competences ?? [],
      educations: this.editingCv.educations ?? [],
      experiences: this.editingCv.experiences ?? [],
      langues: this.editingCv.langues ?? [],
    };

    this.cvSaving = true;
    this.cvService.updateCV(this.editingCv.id_cv, payload).subscribe({
      next: () => {
        this.cvSaving = false;
        this.successMsg = 'CV mis à jour.';
        this.closeCvModal();
        this.loadTabData('cvs');
      },
      error: (err) => {
        this.cvSaving = false;
        this.errorMsg = err?.error?.error ?? 'Erreur lors de la mise à jour du CV.';
      },
    });
  }

  cvControlError(controlName: string): string | null {
    const control = this.cvFormGroup.get(controlName);
    if (!control || !(control.touched || control.dirty) || !control.errors) {
      return null;
    }
    if (control.errors['required']) {
      return 'Ce champ est obligatoire.';
    }
    return 'Valeur invalide.';
  }

  isCvInvalid(controlName: string): boolean {
    const control = this.cvFormGroup.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  get filteredOffres(): any[] {
    const q = this.offreSearch.trim().toLowerCase();
    return this.offres.filter((o) => {
      const name = o?.descrip_mission?.mission_name ?? '';
      const ville = o?.ville?.nom ?? '';
      const matchSearch =
        !q ||
        `${o.idMission} ${name} ${ville} ${o.user_id ?? ''}`.toLowerCase().includes(q);
      return matchSearch;
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
    this.userFormGroup = this.buildUserForm();
    this.showUserModal = true;
  }

  openEditUser(user: AdminUser): void {
    this.editingUser = user;
    this.userFormGroup = this.buildUserForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? '',
      role: user.roleName,
      nomSociete: user.nomSociete ?? '',
      country: user.country ?? '',
      password: '',
    });
    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.editingUser = null;
    this.userFormGroup.reset();
  }

  saveUser(): void {
    this.clearMessages();
    this.userFormGroup.markAllAsTouched();
    if (this.userFormGroup.invalid) {
      this.errorMsg = 'Veuillez corriger les champs en rouge avant d’enregistrer.';
      return;
    }

    const formValue = this.userFormGroup.getRawValue();
    const payload = {
      ...formValue,
      firstName: String(formValue.firstName).trim(),
      lastName: String(formValue.lastName).trim(),
      email: String(formValue.email).trim(),
      phone: String(formValue.phone ?? '').trim(),
      nomSociete: String(formValue.nomSociete ?? '').trim(),
      country: String(formValue.country ?? '').trim(),
      password: String(formValue.password ?? '').trim(),
    };

    if (this.editingUser) {
      const updatePayload = { ...payload };
      if (!updatePayload.password) {
        delete (updatePayload as { password?: string }).password;
      }
      this.adminService.updateUser(this.editingUser.userId, updatePayload).subscribe({
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

    const createPayload = { ...payload };
    if (!createPayload.password) {
      delete (createPayload as { password?: string }).password;
    }
    this.adminService.createUser(createPayload).subscribe({
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

  controlError(controlName: string): string | null {
    const control = this.userFormGroup.get(controlName);
    if (!control || !(control.touched || control.dirty) || !control.errors) {
      return null;
    }
    const firstKey = Object.keys(control.errors)[0];
    const err = control.errors[firstKey];
    if (err?.message) {
      return err.message;
    }
    if (firstKey === 'required') {
      return 'Ce champ est obligatoire.';
    }
    return 'Valeur invalide.';
  }

  isInvalid(controlName: string): boolean {
    const control = this.userFormGroup.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  isUserActive(user: AdminUser): boolean {
    return user.status === 'ACTIVE';
  }

  toggleUserStatus(user: AdminUser): void {
    const newStatus = this.isUserActive(user) ? 'INACTIVE' : 'ACTIVE';
    const actionLabel = newStatus === 'ACTIVE' ? 'activer' : 'désactiver';
    if (!confirm(`${actionLabel.charAt(0).toUpperCase()}${actionLabel.slice(1)} le compte de ${user.firstName} ${user.lastName} ?`)) {
      return;
    }
    this.clearMessages();
    this.adminService.updateUserStatus(user.userId, newStatus).subscribe({
      next: () => {
        this.successMsg = newStatus === 'ACTIVE' ? 'Compte activé.' : 'Compte désactivé.';
        this.loadTabData('users');
      },
      error: () => {
        this.errorMsg = `Erreur lors de la ${actionLabel} du compte.`;
      },
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'Actif',
      INACTIVE: 'Inactif',
      PENDING: 'En attente',
    };
    return map[status] ?? status;
  }

  updateCandidatureStatus(candidature: any, status: string): void {
    if (!this.candidatureStatuses.includes(status)) {
      this.errorMsg = 'Statut candidature invalide.';
      return;
    }
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
      ESN_ADMIN: 'RH',
      CANDIDAT: 'Candidat',
      ADMIN: 'Admin',
    };
    return map[role] ?? role;
  }

  private buildCvForm(values?: {
    titreDeProfil?: string;
    candidateName?: string;
  }): FormGroup {
    return this.fb.group({
      candidateName: [{ value: values?.candidateName ?? '', disabled: true }],
      titreDeProfil: [values?.titreDeProfil ?? '', [Validators.required]],
    });
  }

  private buildUserForm(values?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role?: string;
    nomSociete?: string;
    country?: string;
    password?: string;
  }): FormGroup {
    return this.fb.group({
      firstName: [values?.firstName ?? '', [Validators.required, AppValidators.personName]],
      lastName: [values?.lastName ?? '', [Validators.required, AppValidators.personName]],
      email: [values?.email ?? '', [Validators.required, AppValidators.email]],
      phone: [values?.phone ?? '', [AppValidators.phoneOptional]],
      role: [values?.role ?? 'CANDIDAT', [Validators.required, AppValidators.adminRole]],
      nomSociete: [values?.nomSociete ?? '', [AppValidators.companyNameOptional]],
      country: [values?.country ?? '', [AppValidators.countryOptional]],
      password: [values?.password ?? '', [AppValidators.passwordOptional]],
    });
  }

  private clearMessages(): void {
    this.errorMsg = '';
    this.successMsg = '';
  }
}
