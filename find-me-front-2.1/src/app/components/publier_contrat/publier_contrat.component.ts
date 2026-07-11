import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from '../../shared/validators/app-validators';
import { animate, style, transition, trigger } from '@angular/animations';
import { MissionService } from '../../services/mission';
import { ApiRoutingServiceUser } from '../../services/api-routing-user.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../services/notificationService';
import { buildNewPublishedMissionMessage } from '../../shared/constants/notification-messages';
import { catchError, finalize, forkJoin, of, timeout } from 'rxjs';
import { isRecruiterRole } from '../../shared/constants/role-utils';

@Component({
  selector: 'app-publier_contrat',
  templateUrl: './publier_contrat.component.html',
  styleUrls: ['./publier_contrat.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateX(-20px)' }))
      ])
    ])
  ]
})
export class PublierContratComponent implements OnInit {
  storedtargetmarket:string='';
  @Output() isEditing = new EventEmitter<boolean>();
  currentStep = 1;
  steps = ['Infos de base', 'Dates & Localisation', 'Exigences', 'Conditions', 'Validation'];
  competences: string[] = [];
  missionForm: FormGroup;
  confirmationChecked = false;
  accountId: number | null = null;
  accountRole: string = '';
  idsocieter: number | null = null;
  @Input() jobs: any[] = [];
  @Input() action: string = '';
  countries = [
    { id: 1, nom: 'France' },
    { id: 2, nom: 'Tunisie' },
  ];

  cities = [
    // France
    { idVille: 1, nomdeville: 'Paris', pays: { id: 1 } },
    { idVille: 2, nomdeville: 'Versailles', pays: { id: 1 } },
    { idVille: 3, nomdeville: 'Boulogne-Billancourt', pays: { id: 1 } },
    { idVille: 4, nomdeville: 'Lyon', pays: { id: 1 } },
    { idVille: 5, nomdeville: 'Grenoble', pays: { id: 1 } },
    { idVille: 6, nomdeville: 'Clermont-Ferrand', pays: { id: 1 } },
    { idVille: 7, nomdeville: 'Marseille', pays: { id: 1 } },
    { idVille: 8, nomdeville: 'Nice', pays: { id: 1 } },
    { idVille: 9, nomdeville: 'Toulon', pays: { id: 1 } },
    { idVille: 10, nomdeville: 'Toulouse', pays: { id: 1 } },
    { idVille: 11, nomdeville: 'Montpellier', pays: { id: 1 } },
    { idVille: 12, nomdeville: 'Nîmes', pays: { id: 1 } },
    { idVille: 13, nomdeville: 'Bordeaux', pays: { id: 1 } },
    { idVille: 14, nomdeville: 'Limoges', pays: { id: 1 } },
    { idVille: 15, nomdeville: 'Poitiers', pays: { id: 1 } },
    // Tunisie
    { idVille: 16, nomdeville: 'Tunis', pays: { id: 2 } },
    { idVille: 17, nomdeville: 'La Marsa', pays: { id: 2 } },
    { idVille: 18, nomdeville: 'Carthage', pays: { id: 2 } },
    { idVille: 19, nomdeville: 'Sfax', pays: { id: 2 } },
    { idVille: 20, nomdeville: 'Sousse', pays: { id: 2 } },
    { idVille: 21, nomdeville: 'Monastir', pays: { id: 2 } },
    { idVille: 22, nomdeville: 'Mahdia', pays: { id: 2 } },
    { idVille: 23, nomdeville: 'Kairouan', pays: { id: 2 } },
    { idVille: 24, nomdeville: 'Gafsa', pays: { id: 2 } },
    { idVille: 25, nomdeville: 'Gabès', pays: { id: 2 } },
    { idVille: 26, nomdeville: 'Tozeur', pays: { id: 2 } },
    { idVille: 27, nomdeville: 'Bizerte', pays: { id: 2 } },
    { idVille: 28, nomdeville: 'Béja', pays: { id: 2 } },
    { idVille: 29, nomdeville: 'Jendouba', pays: { id: 2 } }
  ];

  filteredCities = this.cities;
  espace: string = '';
  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private missionService: MissionService,
    private authServiceUser: AuthService,
    private apiRoutingServiceUser: ApiRoutingServiceUser,
    private notificationService: NotificationService,
  ) {
    this.missionForm = this.fb.group({
      reference_code: [''],
      id_societer: [null],
      archived: [false],
      statusMission: ["OPEN"],
      logo: "",
      descrip_mission: this.fb.group({
        mission_name: ['', [Validators.required, AppValidators.missionLabel]],
        avantages: ['', [Validators.required, AppValidators.meaningfulText(10)]],
        description: ['', [Validators.required, AppValidators.meaningfulText(20)]],
        date_debut: ['', [Validators.required, AppValidators.missionStartDate]],
        date_fin: ['', Validators.required],
        poste: ['', [Validators.required, AppValidators.missionLabel]],
        langue: ['', Validators.required],
        futures_taches: ['', [Validators.required, AppValidators.meaningfulText(10)]],
        nbre_recruteurs: [null, [Validators.required, AppValidators.positionsCount]],
        salaire: [null, [Validators.required, AppValidators.salary]],
        isRemote: [false],
        statut: ['None'],
        typeContrat: ['', Validators.required],
      }, { validators: AppValidators.missionDateRange }),
      profilDemande: this.fb.group({
        exigences: ['', [Validators.required, AppValidators.meaningfulText(10)]],
        annees_experiences: [null, [Validators.required, AppValidators.experienceYears]]
      }),
      ville: this.fb.group({
        nomdeville: ["", Validators.required],
        pays: this.fb.group({
          nom: ["", Validators.required]
        })
      }),
    });
  }

  ngOnInit(): void {
    this.accountId = this.authServiceUser.getUserId()!;
    this.accountRole = this.authServiceUser.getRole()!;

    // //console.log(this.action)
    this.espace = this.route.snapshot.data['espace'] || '';
    console.log(this.espace)
    const profile = JSON.parse(sessionStorage.getItem('profile') || '{}');
    this.storedtargetmarket = profile.targetmarket;
    const defaultCountry =
      this.storedtargetmarket === 'Tunisien'
        ? 'Tunisie'
        : this.storedtargetmarket === 'Francais'
          ? 'France'
          : '';

    if (defaultCountry) {
      this.missionForm.get('ville.pays.nom')?.setValue(defaultCountry);
    }
    this.onCountryChange();
  this.setupDateRevalidation();

    if (this.accountRole === "ESN_ADMIN") {
      this.missionForm.patchValue({
        id_societer: this.accountId
      });
    } else {    
      this.apiRoutingServiceUser.getUserByEmail(
        this.authServiceUser.getEmail()!,
        this.authServiceUser.getToken()!
      ).subscribe({
        next: (response) => {
          this.missionForm.patchValue({
            id_societer: response.id_societer
          });
        },
        error: (error) => {
          console.error('❌ Erreur lors de la récupération des infos personnelles', error);
        }
      });
    }

    // Initialiser par les valeurs jobs
    if(this.action==="modifier"){
      if (this.jobs && this.jobs.length > 0) {
    const job = this.jobs[0]; // Assuming you want the first job
    
    // Convert timestamp to date string (YYYY-MM-DD)
    const formatDate = (timestamp: number): string => {
      const date = new Date(timestamp);
      return date.toISOString().split('T')[0];
    };

    this.missionForm.patchValue({
      reference_code: job.reference_code,
      archived: job.archived,
      statusMission: job.statusMission,
      logo: "",
      descrip_mission: {
        mission_name: job.title,
        avantages: job.avantages,
        description: job.description,
        date_debut: formatDate(job.date_debut),
        date_fin: formatDate(job.date_fin),
        poste: job.title, // or another field if available
        langue: job.langue,
        futures_taches: job.description, // or another field if available
        nbre_recruteurs: job.nbre_recruteurs,
        salaire: job.salary,
        isRemote: job.isRemote,
        // statut: job.statut,
        status:'None',
        typeContrat: job.type
      },
      profilDemande: {
        exigences: job.exigences,
        annees_experiences: parseInt(job.experience) || 0 // Convert "3 ans" to 3
      },
      ville: {
  nomdeville: job.location.split(' ')[1], // Gets the city part (second word)
  pays: {
    nom: job.location.split(' ')[0] // Gets the country part (first word)
  }
}
    });
    this.onCountryChange();

    // Set competences
    if (job.competences && job.competences.length > 0) {
      this.competences = [...job.competences];
    }
  }
    }
  }

  private setupDateRevalidation(): void {
    const descrip = this.missionForm.get('descrip_mission');
    descrip?.get('date_debut')?.valueChanges.subscribe(() => {
      descrip?.get('date_fin')?.updateValueAndValidity({ emitEvent: false });
      descrip?.updateValueAndValidity({ emitEvent: false });
    });
    descrip?.get('date_fin')?.valueChanges.subscribe(() => {
      descrip?.updateValueAndValidity({ emitEvent: false });
    });
  }

  showError(controlPath: string): boolean {
    const control = this.getControl(controlPath);
    if (!control) {
      return this.showDateRangeError(controlPath);
    }
    return (control.invalid && (control.dirty || control.touched)) ||
           this.showDateRangeError(controlPath);
  }

  showDateRangeError(controlPath: string): boolean {
    if (controlPath !== 'descrip_mission.date_fin' && controlPath !== 'descrip_mission.date_debut') {
      return false;
    }
    const descrip = this.missionForm.get('descrip_mission');
    const touched =
      descrip?.get('date_debut')?.touched ||
      descrip?.get('date_fin')?.touched ||
      descrip?.get('date_debut')?.dirty ||
      descrip?.get('date_fin')?.dirty;
    return !!descrip?.errors?.['missionDateRange'] && !!touched;
  }

  getErrorMessage(controlPath: string): string {
    const control = this.getControl(controlPath);
    if (control?.errors) {
      const errors = control.errors;
      for (const key of Object.keys(errors)) {
        const payload = errors[key];
        if (payload?.message) {
          return payload.message;
        }
      }
      if (errors['required']) {
        return 'Ce champ est requis';
      }
    }
    if (this.showDateRangeError(controlPath)) {
      return this.missionForm.get('descrip_mission')?.errors?.['missionDateRange']?.message
        || 'Période invalide';
    }
    return 'Ce champ est requis';
  }

  showCompetencesError(): boolean {
    return this.competences.length === 0 && this.competencesTouched;
  }

  private competencesTouched = false;

  isStepInvalid(): boolean {
    if (this.currentStep === 1) {
      return !this.getControl('descrip_mission.mission_name')?.valid ||
             !this.getControl('descrip_mission.poste')?.valid ||
             !this.getControl('descrip_mission.typeContrat')?.valid ||
             !this.getControl('descrip_mission.description')?.valid;
    } else if (this.currentStep === 2) {
      const descrip = this.missionForm.get('descrip_mission');
      return !this.getControl('descrip_mission.date_debut')?.valid ||
             !this.getControl('descrip_mission.date_fin')?.valid ||
             !!descrip?.errors?.['missionDateRange'] ||
             !this.getControl('ville.pays.nom')?.valid ||
             !this.getControl('ville.nomdeville')?.valid;
    } else if (this.currentStep === 3) {
      return !this.getControl('profilDemande.annees_experiences')?.valid ||
             !this.getControl('descrip_mission.langue')?.valid ||
             !this.getControl('profilDemande.exigences')?.valid ||
             this.competences.length === 0;
    } else if (this.currentStep === 4) {
      return !this.getControl('descrip_mission.salaire')?.valid ||
             !this.getControl('descrip_mission.nbre_recruteurs')?.valid ||
             !this.getControl('descrip_mission.avantages')?.valid ||
             !this.getControl('descrip_mission.futures_taches')?.valid;
    }
    return false;
  }
  nextStep(): void {
    if (this.isStepInvalid()) {
      this.markCurrentStepAsTouched();
      return;
    }
    if (this.currentStep < this.steps.length) {
      this.currentStep++;
    }
  }

  private markCurrentStepAsTouched(): void {
    const pathsByStep: Record<number, string[]> = {
      1: ['descrip_mission.mission_name', 'descrip_mission.poste', 'descrip_mission.typeContrat', 'descrip_mission.description'],
      2: ['descrip_mission.date_debut', 'descrip_mission.date_fin', 'ville.pays.nom', 'ville.nomdeville'],
      3: ['profilDemande.annees_experiences', 'descrip_mission.langue', 'profilDemande.exigences'],
      4: ['descrip_mission.salaire', 'descrip_mission.nbre_recruteurs', 'descrip_mission.avantages', 'descrip_mission.futures_taches'],
    };
    for (const path of pathsByStep[this.currentStep] || []) {
      this.getControl(path)?.markAsTouched();
    }
    if (this.currentStep === 3 && this.competences.length === 0) {
      this.competencesTouched = true;
    }
    if (this.currentStep === 2) {
      this.missionForm.get('descrip_mission')?.markAsTouched();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

 

  addCompetence(input: HTMLInputElement): void {
    const value = input.value.trim();
    const labelError = AppValidators.validateMissionLabel(value);
    if (labelError) {
      this.competencesTouched = true;
      return;
    }
    if (value && !this.competences.includes(value)) {
      this.competences.push(value);
      input.value = '';
      this.competencesTouched = false;
    }
  }

  removeCompetence(competence: string): void {
    this.competences = this.competences.filter(c => c !== competence);
  }

  onCountryChange(): void {
    const countryName = this.missionForm.get('ville.pays.nom')?.value;
    if (!countryName) {
      this.filteredCities = [];
      this.missionForm.get('ville.nomdeville')?.setValue('');
      return;
    }
    const country = this.countries.find((c) => c.nom === countryName);
    if (!country) {
      this.filteredCities = [];
      return;
    }
    this.filteredCities = this.cities.filter((city) => city.pays.id === country.id);
    const currentCity = this.missionForm.get('ville.nomdeville')?.value;
    const cityStillInList = this.filteredCities.some((c) => c.nomdeville === currentCity);
    if (!cityStillInList && this.filteredCities.length > 0) {
      this.missionForm.get('ville.nomdeville')?.setValue(this.filteredCities[0].nomdeville);
    }
  }

  getSelectedCityName(): string {
    return this.missionForm.get('ville.nomdeville')?.value;
  }

  getSelectedCountryName(): string {
    return this.missionForm.get('ville.pays.nom')?.value;
  }

  onConfirmationChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.confirmationChecked = target.checked;
  }

  private showLoadingSwal(): void {
    Swal.fire({
      title: 'Traitement en cours',
      html: 'Veuillez patienter ...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
  }

  private closeLoadingSwal(): void {
    if (Swal.isLoading()) {
      Swal.close();
    }
  }

  private showHttpError(title: string, err: unknown): void {
    const e = err as { error?: unknown; message?: string; status?: number };
    const body = e?.error;
    const serverText =
      typeof body === 'string'
        ? body
        : (body as { message?: string })?.message ||
          (body as { detail?: string })?.detail ||
          (Array.isArray((body as { errors?: string[] })?.errors)
            ? (body as { errors: string[] }).errors.join('\n')
            : null) ||
          (body ? JSON.stringify(body) : null);
    Swal.fire({
      title,
      text:
        serverText ||
        e?.message ||
        (e?.status === 0
          ? 'Service mission indisponible (vérifiez Docker : findme-mission port 9055).'
          : 'Une erreur est survenue.'),
      icon: 'error',
      confirmButtonText: 'OK',
    });
  }

  private resolveMissionId(): number | null {
    const job = this.jobs?.[0];
    const raw = job?.id ?? job?.idMission;
    if (raw == null || raw === '') {
      return null;
    }
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  submitForm(): void {
    if (this.missionForm.valid && this.confirmationChecked) {
      this.showLoadingSwal();
      const formatDateForBackend = (dateString: string): string => {
        if (!dateString) return '';
        if (String(dateString).includes('T')) return String(dateString);
        return `${dateString}T00:00:00`;
      };

      const raw = this.missionForm.value;
      const paysNom = raw.ville?.pays?.nom;
      const country = this.countries.find((c) => c.nom === paysNom);

      const ref = (raw.reference_code || '').toString().trim();
      // Ne pas envoyer idVille : les id du composant ne sont pas ceux de la base (404 "Ville introuvable").
      const formData = {
        ...raw,
        reference_code: ref || `REF-${Date.now()}`,
        descrip_mission: {
          ...raw.descrip_mission,
          date_debut: formatDateForBackend(raw.descrip_mission.date_debut),
          date_fin: formatDateForBackend(raw.descrip_mission.date_fin),
          competencesRequises: this.competences
        },
        ville: {
          nomdeville: raw.ville?.nomdeville ?? '',
          pays: country ? { nom: country.nom } : { nom: raw.ville?.pays?.nom ?? '' },
        },
        statusMission: 'OPEN',
      };
      
      //console.log('Form submitted:', formData);
      if (this.action === 'modifier') {
        const missionId = this.resolveMissionId();
        if (!missionId) {
          this.closeLoadingSwal();
          Swal.fire({
            title: 'Erreur',
            text: 'Identifiant de l’offre introuvable.',
            icon: 'error',
          });
          return;
        }
        this.missionService
          .updateMission(missionId, formData)
          .pipe(
            timeout(90000),
            finalize(() => this.closeLoadingSwal())
          )
          .subscribe({
            next: () => {
              Swal.fire({
                title: 'Mise à jour réussie !',
                text: 'Le contrat a été modifié avec succès.',
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#3085d6',
              });
              this.authServiceUser.notifyDataUpdate();
              this.isEditing.emit(false);
            },
            error: (error) => {
              console.error('Failed to update mission:', error);
              this.showHttpError('Échec de la modification', error);
            },
          });
      } else {
      this.missionService.createMission(formData, this.accountId!).pipe(
        timeout(90000),
        finalize(() => this.closeLoadingSwal())
      ).subscribe({
        next: (response) => {
          this.notifyCandidatesOnNewPublication(response, formData);
          Swal.fire({
            title: '',
            text: "Publication réussie.",
            icon: 'success',
            confirmButtonText: 'oui'
          });
          this.authServiceUser.notifyDataUpdate();
          // Reset form and go back to step 1
          this.missionForm.reset();
          this.currentStep = 1;
          this.competences = [];
          this.confirmationChecked = false;
          // Reinitialize form values
          this.missionForm.patchValue({
            statusMission: "OPEN",
            archived: false,
            descrip_mission: {
              langue: 'FRANCAIS',
              statut: 'None',
              typeContrat: 'CDI'
            },
            ville: {
              nomdeville: 'Paris',
              pays: {
                nom: 'France'
              }
            }
          });
        },
        error: (err) => {
          console.error('Error creating mission:', err);
          this.showHttpError('Erreur', err);
        }
      });
      }
    } else {
      //console.log('Form is invalid or confirmation not checked');
      this.markAllFieldsAsTouched();
      Swal.fire({
        title: 'Erreur',
        text: 'Veuillez corriger les erreurs et confirmer les informations',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  }

  getControl(path: string) {
    return this.missionForm.get(path);
  }

  isControlInvalid(path: string): boolean {
    const control = this.missionForm.get(path);
    return control ? control.invalid && control.touched : false;
  }

  markAllFieldsAsTouched(): void {
    const markGroup = (group: FormGroup): void => {
      Object.keys(group.controls).forEach((key) => {
        const control = group.get(key);
        if (!control) {
          return;
        }
        control.markAsTouched();
        if (control instanceof FormGroup) {
          markGroup(control);
        }
      });
    };
    markGroup(this.missionForm);
    this.competencesTouched = true;
  }

  private notifyCandidatesOnNewPublication(createdMission: any, formData: any): void {
    const missionId = createdMission?.idMission ?? createdMission?.id ?? null;
    if (!missionId) {
      return;
    }

    const typeContrat = String(
      createdMission?.descrip_mission?.typeContrat ??
      formData?.descrip_mission?.typeContrat ??
      ''
    ).toUpperCase();
    const offreTypes = ['CDI', 'CDD', 'ALTERNANCE'];
    const isOffre = offreTypes.includes(typeContrat);
    const targetType = isOffre ? 'OFFRE' : 'MISSION';
    /** Route canonique candidat ; le clic notif est recalculé par rôle (resolveNotificationUrl). */
    const targetRoute = isOffre
      ? `/OffreDetails/${missionId}`
      : `/MissionDetails/${missionId}`;

    const missionName = createdMission?.descrip_mission?.mission_name || formData?.descrip_mission?.mission_name || 'Sans titre';
    const message = buildNewPublishedMissionMessage({
      missionName,
      referenceCode: createdMission?.reference_code,
      typeContrat,
    });

    const rolesToNotify = ['CANDIDAT', 'FREELANCER', 'PORTAGE_SALARIAL'];
    const roleRequests = rolesToNotify.map((role) =>
      this.apiRoutingServiceUser.requestGetApi(`/role/${role}`).pipe(catchError(() => of([])))
    );

    forkJoin(roleRequests).subscribe((roleResults) => {
      const users = roleResults
        .flatMap((result: any) => (Array.isArray(result) ? result : [result]))
        .filter((u: any) => u && u.userId)
        .map((u: any) => Number(u.userId))
        .filter((id: number, index: number, arr: number[]) => !isNaN(id) && arr.indexOf(id) === index);

      for (const userId of users) {
        this.notificationService.sendNotificationToUserWithTarget(
          String(userId),
          message,
          targetRoute,
          Number(missionId),
          targetType
        );
      }
    });
  }
}