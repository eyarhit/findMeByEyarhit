import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { MissionService } from '../../services/mission';
import { ApiRoutingServiceUser } from '../../services/api-routing-user.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../services/notificationService';
import { catchError, forkJoin, of } from 'rxjs';

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
        mission_name: ['', Validators.required],
        avantages: ['', Validators.required],
        description: ['', Validators.required],
        date_debut: ['', Validators.required],
        date_fin: ['', Validators.required],
        poste: ['', Validators.required],
        langue: ['', Validators.required],
        futures_taches: ['', Validators.required],
        nbre_recruteurs: [0, [Validators.required, Validators.min(1)]],
        salaire: [0, [Validators.required, Validators.min(0)]],
        isRemote: [false],
        statut: ['None'],
        typeContrat: ['', Validators.required],
      }),
      profilDemande: this.fb.group({
        exigences: ['', Validators.required],
        annees_experiences: [0, [Validators.required, Validators.min(0)]]
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
    // //console.log(this.storedtargetmarket)

    
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

  // Dans votre composant TypeScript
showError(controlPath: string): boolean {
  const control = this.getControl(controlPath);
  if (!control) return false;
  
  return control.invalid && (control.dirty || control.touched);
}

showCompetencesError(): boolean {
  const competencesControl = this.missionForm.get('competences');
  return this.competences.length === 0 && 
         (competencesControl?.dirty || competencesControl?.touched || false);
}

// Modifiez également la méthode isStepInvalid pour qu'elle ne marque pas tous les champs comme touchés
isStepInvalid(): boolean {
  if (this.currentStep === 1) {
    return !this.getControl('reference_code')?.valid ||
           !this.getControl('descrip_mission.mission_name')?.valid ||
           !this.getControl('descrip_mission.poste')?.valid ||
           !this.getControl('descrip_mission.typeContrat')?.valid ||
           !this.getControl('descrip_mission.description')?.valid;
  } else if (this.currentStep === 2) {
    return !this.getControl('descrip_mission.date_debut')?.valid ||
           !this.getControl('descrip_mission.date_fin')?.valid ||
           !this.getControl('ville.pays.nom')?.valid ||
           !this.getControl('ville.nomdeville')?.valid;
  } else if (this.currentStep === 3) {
    return !this.getControl('profilDemande.annees_experiences')?.valid ||
           !this.getControl('descrip_mission.langue')?.valid ||
           this.competences.length === 0;
  } else if (this.currentStep === 4) {
    return !this.getControl('descrip_mission.salaire')?.valid ||
           !this.getControl('descrip_mission.nbre_recruteurs')?.valid ||
           !this.getControl('descrip_mission.statut')?.valid ||
           !this.getControl('descrip_mission.avantages')?.valid ||
           !this.getControl('descrip_mission.futures_taches')?.valid;
  }
  return false;
}
  nextStep(): void {
    if (this.currentStep < this.steps.length && !this.isStepInvalid()) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

 

  addCompetence(input: HTMLInputElement): void {
    const value = input.value.trim();
    if (value && !this.competences.includes(value)) {
      this.competences.push(value);
      input.value = '';
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

  submitForm(): void {
    if (this.missionForm.valid && this.confirmationChecked) {
      Swal.fire({
        title: 'Traitement en cours',
        html: 'Veuillez patienter ...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
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
          ...raw.ville,
          pays: country ? { id: country.id, nom: country.nom } : raw.ville?.pays
        },
        statusMission: 'OPEN',
      };
      
      //console.log('Form submitted:', formData);
      if(this.action==="modifier"){
            this.missionService.updateMission(this.jobs[0].id, formData).subscribe({
      next: (response) => {
        // //console.log('Mission updated successfully:', response);
         Swal.fire({
         title: 'Mise à jour réussie !',
         text: 'Le contrat a été modifié avec succès.',
         icon: 'success',
         confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6',
});
this.authServiceUser.notifyDataUpdate()
this.isEditing.emit(false);
      },
      error: (error) => {
        console.error('Failed to update mission:', error);
        // Handle error (show error message)
      }
    });
  
      }
      else{
      this.missionService.createMission(formData, this.accountId!).subscribe({
        next: (response) => {
          this.notifyCandidatesOnNewPublication(response, formData);
          Swal.fire({
            title: '',
            text: "Publication réussie.",
            icon: 'success',
            confirmButtonText: 'oui'
          });
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
          const body = err?.error;
          const serverText =
            typeof body === 'string'
              ? body
              : body?.message ||
                body?.detail ||
                (Array.isArray(body?.errors) ? body.errors.join('\n') : null) ||
                (body ? JSON.stringify(body) : null);
          Swal.fire({
            title: 'Erreur',
            text:
              serverText ||
              err?.message ||
              "Une erreur est survenue lors de la création du contrat.",
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      });}
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
    Object.keys(this.missionForm.controls).forEach(key => {
      const control = this.missionForm.get(key);
      if (control) {
        control.markAsTouched();
        if (control instanceof FormGroup) {
          Object.keys(control.controls).forEach(nestedKey => {
            control.get(nestedKey)?.markAsTouched();
          });
        }
      }
    });
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
    const targetRoute = offreTypes.includes(typeContrat)
      ? `/OffreDetails/${missionId}`
      : `/MissionDetails/${missionId}`;

    const missionName = createdMission?.descrip_mission?.mission_name || formData?.descrip_mission?.mission_name || 'nouvelle annonce';
    const message = `Nouvelle annonce publiée: ${missionName}`;

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
          'MISSION'
        );
      }
    });
  }
}