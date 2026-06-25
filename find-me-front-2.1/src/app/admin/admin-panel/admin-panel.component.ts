import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
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
  cvDetailsLoading = false;
  selectedCv: Cv | null = null;
  selectedCvCandidate: AdminUser | null = null;

  showOffreModal = false;
  offreDetailsLoading = false;
  selectedOffre: any | null = null;
  selectedOffrePublisher: AdminUser | null = null;

  showCandidatureModal = false;
  candidatureDetailsLoading = false;
  selectedCandidature: any | null = null;
  selectedCandidatureCandidate: AdminUser | null = null;
  selectedCandidatureMission: any | null = null;
  selectedCandidatureCv: Cv | null = null;

  private userById = new Map<number, AdminUser>();

  /** Rôles utilisés dans l'application : Candidat, RH, Admin */
  readonly roles = ['CANDIDAT', 'ESN_ADMIN', 'ADMIN'];
  readonly candidatureFilterStatuses = ['ENCOURS', 'ACCEPTER', 'REFUSER'];
  readonly candidatureActionStatuses = ['ACCEPTER', 'REFUSER'];

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
      forkJoin({
        cvs: this.cvService.getAllCvs(),
        users: this.adminService.getAllUsers(),
      }).subscribe({
        next: ({ cvs, users }) => {
          this.cvs = cvs ?? [];
          this.users = users ?? [];
          this.userById = new Map(
            this.users.map((u) => [u.userId, u])
          );
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
      forkJoin({
        offres: this.missionService.getAllMissions(),
        users: this.adminService.getAllUsers(),
      }).subscribe({
        next: ({ offres, users }) => {
          this.offres = offres ?? [];
          this.users = users ?? [];
          this.userById = new Map(
            this.users.map((u) => [u.userId, u])
          );
          this.loading = false;
        },
        error: () => {
          this.errorMsg = 'Impossible de charger les offres.';
          this.loading = false;
        },
      });
      return;
    }

    forkJoin({
      candidatures: this.candidatureService.getAllCandidatures(),
      users: this.adminService.getAllUsers(),
    }).subscribe({
      next: ({ candidatures, users }) => {
        this.candidatures = candidatures ?? [];
        this.users = users ?? [];
        this.userById = new Map(
          this.users.map((u) => [u.userId, u])
        );
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

  getCvName(cv: any): string {
    const titre = (cv?.titreDeProfil ?? '').trim();
    if (!titre) {
      return 'CV sans titre';
    }
    return titre.length > 70 ? `${titre.slice(0, 67)}...` : titre;
  }

  getCandidateName(cv: any): string {
    const user = this.userById.get(Number(cv?.userId));
    if (!user) {
      return 'Candidat inconnu';
    }
    return `${user.firstName} ${user.lastName}`.trim();
  }

  getCandidateEmail(cv: any): string {
    return this.userById.get(Number(cv?.userId))?.email ?? '—';
  }

  openCvDetails(cv: any): void {
    const userId = Number(cv?.userId);
    if (!Number.isFinite(userId)) {
      this.errorMsg = 'Impossible de charger ce CV.';
      return;
    }
    this.clearMessages();
    this.showCvModal = true;
    this.cvDetailsLoading = true;
    this.selectedCv = null;
    this.selectedCvCandidate = this.userById.get(userId) ?? null;

    this.cvService.getCvByUserId(userId).subscribe({
      next: (fullCv) => {
        this.selectedCv = fullCv;
        this.cvDetailsLoading = false;
      },
      error: () => {
        this.cvDetailsLoading = false;
        this.showCvModal = false;
        this.errorMsg = 'Impossible de charger les détails du CV.';
      },
    });
  }

  closeCvDetails(): void {
    this.showCvModal = false;
    this.selectedCv = null;
    this.selectedCvCandidate = null;
    this.cvDetailsLoading = false;
  }

  formatCvDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  }

  formatExperiencePeriod(exp: any): string {
    const start = this.formatCvDate(exp?.dateDebut);
    const end = exp?.dateFin ? this.formatCvDate(exp.dateFin) : 'Présent';
    return `${start} – ${end}`;
  }

  competenceFields(comp: any): { label: string; value: string }[] {
    const fields: { key: string; label: string }[] = [
      { key: 'langageBallsage', label: 'Langages de balisage' },
      { key: 'languageProgrammation', label: 'Langages de programmation' },
      { key: 'framework', label: 'Frameworks' },
      { key: 'bibliotheque', label: 'Bibliothèques' },
      { key: 'api', label: 'API' },
      { key: 'db', label: 'Bases de données' },
      { key: 'systemExploitation', label: 'Systèmes d’exploitation' },
      { key: 'conception', label: 'Conception' },
      { key: 'methodologie', label: 'Méthodologies' },
      { key: 'designPattern', label: 'Design patterns' },
      { key: 'architechture', label: 'Architectures' },
      { key: 'outils', label: 'Outils' },
    ];
    return fields
      .map(({ key, label }) => ({ label, value: String(comp?.[key] ?? '').trim() }))
      .filter((item) => item.value.length > 0);
  }

  get filteredOffres(): any[] {
    const q = this.offreSearch.trim().toLowerCase();
    return this.offres.filter((o) => {
      const matchSearch =
        !q ||
        `${this.getOffreName(o)} ${this.getPublisherName(o)} ${this.getOffreSummary(o)}`
          .toLowerCase()
          .includes(q);
      return matchSearch;
    });
  }

  getOffreName(offre: any): string {
    const name = (offre?.descrip_mission?.mission_name ?? '').trim();
    return name || 'Offre sans titre';
  }

  getPublisherName(offre: any): string {
    const user = this.userById.get(Number(offre?.user_id));
    if (!user) {
      return 'Éditeur inconnu';
    }
    return `${user.firstName} ${user.lastName}`.trim();
  }

  getPublisherCompany(offre: any): string {
    return this.userById.get(Number(offre?.user_id))?.nomSociete ?? '—';
  }

  getPublisherEmail(offre: any): string {
    return this.userById.get(Number(offre?.user_id))?.email ?? '—';
  }

  getOffreSummary(offre: any): string {
    const poste = offre?.descrip_mission?.poste ?? '';
    const ville = offre?.ville?.nom ?? '';
    const pays = offre?.pays?.nom ?? '';
    const lieu = [ville, pays].filter(Boolean).join(', ');
    return [poste, lieu].filter(Boolean).join(' · ');
  }

  openOffreDetails(offre: any): void {
    const missionId = Number(offre?.idMission);
    if (!Number.isFinite(missionId)) {
      this.errorMsg = 'Impossible de charger cette offre.';
      return;
    }
    this.clearMessages();
    this.showOffreModal = true;
    this.offreDetailsLoading = true;
    this.selectedOffre = null;
    this.selectedOffrePublisher = this.userById.get(Number(offre?.user_id)) ?? null;

    this.missionService.getMissionByMissionId(missionId).subscribe({
      next: (fullOffre) => {
        this.selectedOffre = fullOffre;
        this.offreDetailsLoading = false;
      },
      error: () => {
        this.offreDetailsLoading = false;
        this.showOffreModal = false;
        this.errorMsg = 'Impossible de charger les détails de l’offre.';
      },
    });
  }

  closeOffreDetails(): void {
    this.showOffreModal = false;
    this.selectedOffre = null;
    this.selectedOffrePublisher = null;
    this.offreDetailsLoading = false;
  }

  formatOffreDate(value: string | Date | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  offreStatusLabel(status: string | null | undefined): string {
    const map: Record<string, string> = {
      OPEN: 'Ouverte',
      CLOSED: 'Fermée',
      DRAFT: 'Brouillon',
    };
    return status ? (map[status] ?? status) : '—';
  }

  remoteLabel(isRemote: boolean | null | undefined): string {
    if (isRemote === true) return 'Télétravail';
    if (isRemote === false) return 'Sur site';
    return '—';
  }

  get filteredCandidatures(): any[] {
    const q = this.candidatureSearch.trim().toLowerCase();
    return this.candidatures.filter((c) => {
      const matchSearch =
        !q ||
        `${this.getCandidatureCandidateName(c)} ${this.getCandidatureMissionName(c)}`
          .toLowerCase()
          .includes(q);
      const status = c?.statutCandidature ?? '';
      const matchStatus =
        !this.candidatureStatusFilter || status === this.candidatureStatusFilter;
      return matchSearch && matchStatus;
    });
  }

  getCandidatureCandidateName(candidature: any): string {
    const user = this.userById.get(Number(candidature?.candidatId));
    if (!user) {
      return 'Candidat inconnu';
    }
    return `${user.firstName} ${user.lastName}`.trim();
  }

  getCandidatureMissionName(candidature: any): string {
    const name = (candidature?.mission?.descrip_mission?.mission_name ?? '').trim();
    return name || 'Mission inconnue';
  }

  candidatureStatusLabel(status: string | null | undefined): string {
    const map: Record<string, string> = {
      ENCOURS: 'En cours',
      ACCEPTER: 'Acceptée',
      REFUSER: 'Refusée',
    };
    return status ? (map[status] ?? status) : '—';
  }

  candidatureActionValue(candidature: any): string {
    const status = candidature?.statutCandidature;
    return this.candidatureActionStatuses.includes(status) ? status : '';
  }

  openCandidatureDetails(candidature: any): void {
    this.clearMessages();
    this.showCandidatureModal = true;
    this.candidatureDetailsLoading = true;
    this.selectedCandidature = candidature;
    this.selectedCandidatureCandidate =
      this.userById.get(Number(candidature?.candidatId)) ?? null;
    this.selectedCandidatureMission = null;
    this.selectedCandidatureCv = null;

    const candidatId = Number(candidature?.candidatId);
    const missionId = Number(candidature?.mission?.idMission);

    forkJoin({
      mission: Number.isFinite(missionId)
        ? this.missionService.getMissionByMissionId(missionId)
        : of(null),
      cv: Number.isFinite(candidatId)
        ? this.cvService.getCvByUserId(candidatId)
        : of(null),
    }).subscribe({
      next: ({ mission, cv }) => {
        this.selectedCandidatureMission = mission;
        this.selectedCandidatureCv = cv;
        this.candidatureDetailsLoading = false;
      },
      error: () => {
        this.candidatureDetailsLoading = false;
      },
    });
  }

  closeCandidatureDetails(): void {
    this.showCandidatureModal = false;
    this.selectedCandidature = null;
    this.selectedCandidatureCandidate = null;
    this.selectedCandidatureMission = null;
    this.selectedCandidatureCv = null;
    this.candidatureDetailsLoading = false;
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
    if (!this.candidatureActionStatuses.includes(status)) {
      this.errorMsg = 'Seuls les statuts Accepter et Refuser sont autorisés.';
      return;
    }
    this.candidatureService.updateCandidatureStatus(candidature.idCandidature, status).subscribe({
      next: () => {
        this.successMsg = `Candidature ${status === 'ACCEPTER' ? 'acceptée' : 'refusée'}.`;
        this.loadTabData('candidatures');
      },
      error: () => {
        this.errorMsg = 'Erreur mise à jour candidature.';
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
