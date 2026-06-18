import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService, AdminUser } from '../../services/admin.service';
import { CvService } from '../../services/cv.service';
import { MissionService } from '../../services/mission';
import { CandidatureService } from '../../services/candidature';
import { AppValidators } from '../../shared/validators/app-validators';

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

  showUserModal = false;
  editingUser: AdminUser | null = null;
  userFormGroup!: FormGroup;

  /** Rôles utilisés dans l'application : Candidat, RH, Admin */
  readonly roles = ['CANDIDAT', 'ESN_ADMIN', 'ADMIN'];

  constructor(
    private adminService: AdminService,
    private cvService: CvService,
    private missionService: MissionService,
    private candidatureService: CandidatureService,
    private fb: FormBuilder
  ) {
    this.userFormGroup = this.buildUserForm();
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
      return matchSearch && matchRole;
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
      return matchSearch;
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
