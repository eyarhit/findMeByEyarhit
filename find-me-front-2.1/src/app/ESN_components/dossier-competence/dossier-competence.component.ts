import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { CvService } from '../../services/cv.service';
import { isPlatformBrowser } from '@angular/common';
import { jsPDF } from 'jspdf';
import { PdfService } from '../../services/pdf.service';
import { AuthService } from '../../services/auth.service';
import { Cv } from '../../_model/Cv';
import { ChangeDetectorRef } from '@angular/core';
import { StepTrackerService } from '../../services/step-tracker.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dossier-competence',
  templateUrl: './dossier-competence.component.html',
  styleUrl: './dossier-competence.component.scss'
})
export class DossierCompetenceComponent implements OnInit {
  form: FormGroup;
  activeStep = 1;
  currentPage = 1;
  userId: number | null = null; 
  idCv: number | null = null;
  titreDeProfilControl = new FormControl('');
  completedSteps: Set<number> = new Set();
  


showPopup: boolean = false;
popupMessage: string = '';
popupType: 'success' | 'error' | 'info' = 'success';
popupTitle: string = '';
  
  // Notification properties
  showToast = false;
  toastMessage = '';
  toastType = 'success';
  toastIcon = 'fas fa-check-circle';

  steps = [
    { number: 1, description: 'Remplir CV', icon: 'fa-file-alt' },
    { number: 2, description: 'Visualisation & Sauvegarde du CV', icon: 'fa-eye' },
    { number: 3, description: 'Diplômes et Certificats', icon: 'fa-certificate' },
  ];

  constructor(
    private fb: FormBuilder, 
    private cvService: CvService,
    @Inject(PLATFORM_ID) private platformId: object, 
    private authService: AuthService, 
    private pdfService: PdfService,
    private cdr: ChangeDetectorRef, 
    private stepTracker: StepTrackerService,
    private router: Router


  ) {
    this.form = this.fb.group({
      academicFormations: this.fb.array([]),
      professionalExperiences: this.fb.array([]),
      languages: this.fb.array([]),
      technicalSkills: this.fb.group({
        langageBallsage: [''],
        languageProgrammation: [''],
        framework: [''],
        bibliotheque: [''],
        api: [''],
        db: [''],
        systemExploitation: [''],
        conception: [''],
        methodologie: [''],
        designPattern: [''],
        architechture: [''],
        outils: ['']
      })
    });
  }

  

  ngOnInit(): void {
    const decoded = this.authService.getDecodedToken();
    this.userId = decoded?.userId ?? null;
  
    if (!this.userId) {
      console.error("User ID not found");
      return;
    }

    // Charge les étapes AVANT les données du CV
    this.loadSteps();
    
    // Charge les données du CV
    this.loadCvData();
  }

  private loadCompletedSteps(): void {
    if (this.userId) {
      this.stepTracker.loadCompletedSteps(this.userId);
      this.stepTracker.completedSteps$.subscribe(steps => {
        this.completedSteps = steps;
      });
    }
  }

  private loadSteps(): void {
    if (!this.userId) return;
    
    this.stepTracker.completedSteps$.subscribe({
      next: (steps) => {
        this.completedSteps = steps;
        //console.log('Steps loaded:', steps); // Debug
      },
      error: (err) => console.error('Error loading steps:', err)
    });

    this.stepTracker.loadCompletedSteps(this.userId);
  }

  // Notification methods
  showNotification(message: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    
    switch(type) {
      case 'success':
        this.toastIcon = 'fas fa-check-circle';
        break;
      case 'error':
        this.toastIcon = 'fas fa-exclamation-circle';
        break;
      case 'info':
        this.toastIcon = 'fas fa-info-circle';
        break;
    }
  
    this.showToast = true;
  
    // Hide automatically after 5 seconds
    setTimeout(() => {
      this.hideToast();
    }, 6000);
  }

  hideToast() {
    this.showToast = false;
  }

  loadCv(): void {
    if (!this.userId) return;
  
    this.cvService.getCvByUserId(this.userId).subscribe(
      (cv) => {
        if (cv) {
          this.idCv = cv.id_cv ?? 0;
          localStorage.setItem("id_cv", String(this.idCv));
          this.populateForm(cv);
        }
      },
      (error) => console.error('❌ Erreur lors du chargement du CV:', error)
    );
  }

  populateForm(cv: Cv): void {
    cv.educations.forEach((edu) => this.addAcademicFormation(edu));
    cv.experiences.forEach((exp) => this.addProfessionalExperience(exp));
    cv.langues.forEach((lang) => this.addLanguage(lang));
  
    //console.log("✅ Backend a renvoyé ces compétences :", cv.competences);
  
    if (cv.titreDeProfil) {
      this.titreDeProfilControl.setValue(cv.titreDeProfil);
    }
    
    if (cv.competences && cv.competences.length > 0) {
      const competence = cv.competences[0];
      this.form.patchValue({
        technicalSkills: {
          id_competence: competence.id_competence ?? null,
          langageBallsage: competence.langageBallsage || '',
          languageProgrammation: competence.languageProgrammation || '',
          framework: competence.framework || '',
          bibliotheque: competence.bibliotheque || '',
          api: competence.api || '',
          db: competence.db || '',
          systemExploitation: competence.systemExploitation || '',
          conception: competence.conception || '',
          methodologie: competence.methodologie || '',
          designPattern: competence.designPattern || '',
          architechture: competence.architechture || '',
          outils: competence.outils || ''
        }
      });
    }

    
  }

  // Academic Formations
  get academicFormations(): FormArray {
    return this.form.get('academicFormations') as FormArray;
  }

  addAcademicFormation(data?: any): void {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toISOString().substring(0, 10); // "yyyy-MM-dd"
    };
  
    this.academicFormations.push(this.fb.group({
      university: [data?.university || '', Validators.required],
      diplome: [data?.diplome || '', Validators.required],
      dateDebut: [formatDate(data?.dateDebut)],
      dateFin: [formatDate(data?.dateFin)]
    }));
  }
  

  removeAcademicFormation(index: number): void {
    this.academicFormations.removeAt(index);
  }

  // Professional Experiences
  get professionalExperiences(): FormArray {
    return this.form.get('professionalExperiences') as FormArray;
  }

  addProfessionalExperience(data?: any): void {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toISOString().substring(0, 10);
    };
  
    this.professionalExperiences.push(this.fb.group({
      entreprise: [data?.entreprise || '', Validators.required],
      dateDebut: [formatDate(data?.dateDebut)],
      dateFin: [formatDate(data?.dateFin)],
      poste: [data?.poste || '', Validators.required],
      nomProjet: [data?.nomProjet || ''],
      client: [data?.client || ''],
      equipe: [data?.equipe || ''],
      description: [data?.description || ''],
      travailRealise: [data?.travailRealise || ''],
      environnement: [data?.environnement || '']
    }));
  }
  

  removeProfessionalExperience(index: number): void {
    this.professionalExperiences.removeAt(index);
  }

  // Languages
  get languages(): FormArray {
    return this.form.get('languages') as FormArray;
  }

  addLanguage(data?: any): void {
    this.languages.push(this.fb.group({
      name: [data?.name || '', Validators.required],
      niveau: [data?.niveau || '', Validators.required]
    }));
  }

  removeLanguage(index: number): void {
    this.languages.removeAt(index);
  }

  // Form Submission
  onSubmit(): void {
    if (!this.userId) {
      if (this.activeStep === 1) {
        this.showAlert('Erreur', 'userId non trouvé !', 'error');
      }
      return;
    }
  
    const technicalSkillsData = this.form.value.technicalSkills;
  
    const cvData: Cv = {
      id_cv: this.idCv ?? undefined,
      userId: this.userId,
      competences: [technicalSkillsData],
      educations: this.form.value.academicFormations || [],
      experiences: this.form.value.professionalExperiences || [],
      langues: this.form.value.languages || []
    };
  
    const currentStep = this.activeStep;
  
    this.cvService.saveCv(this.userId, cvData).subscribe(
      (response: Cv) => {
        if (currentStep === 1) {
          this.completedSteps.add(1); // Mark step 1 as completed
          this.showAlert('Succès', 'Votre CV a été enregistré avec succès !', 'success');
        }
        if (response.id_cv && !this.idCv) {
          this.idCv = response.id_cv;
        }
      },
      (error: any) => {
        if (currentStep === 1) {
          this.showAlert('Erreur', "Erreur lors de l'enregistrement du CV", 'error');
        }
      }
    );
  }
  

  private markAllAsTouched(): void {
    Object.values(this.form.controls).forEach(control => {
      if (control instanceof FormGroup || control instanceof FormArray) {
        control.markAllAsTouched();
      } else {
        control.markAsTouched();
      }
    });
  }

  goToStep(stepNumber: number): void {
    if (stepNumber >= 1 && stepNumber <= this.steps.length) {
      this.activeStep = stepNumber;
      this.currentPage = 1;
    }
  }

  goToNextPage(): void {
    if (this.activeStep === 1 && this.currentPage === 1) {
      this.currentPage = 2;
    } else {
      this.goToStep(this.activeStep + 1)
    }
  }

  goToPreviousPage(): void {
    if (this.activeStep === 1 && this.currentPage === 2) {
      this.currentPage = 1;
    } else {
      this.goToStep(this.activeStep - 1)
    }
  }

  saveToLibrary() {
    //console.log('CV sauvegardé dans la bibliothèque');
  }

  isGenerating = false;

  async generateCV() {
    if (this.isGenerating) return;
    this.isGenerating = true;

    try {
      const element = document.getElementById('cv-content');
      if (!element) throw new Error('CV content not found');

      element.classList.add('pdf-export-mode');

      let userName = await this.authService.getUserFullName();
      //console.log('User name:', userName);
      
      const fileName = `FIND ME-${userName || 'CV'}`.replace(/\s+/g, '.');
      //console.log('Final file name:', fileName);

      await this.pdfService.generateMultiPagePdf(element, fileName);
      
    } catch (error) {
      console.error('Error generating CV:', error);
      this.showNotification('Error generating PDF. Please try again.', 'error');
    } finally {
      const element = document.getElementById('cv-content');
      if (element) element.classList.remove('pdf-export-mode');
      this.isGenerating = false;
    }
  }

  languageList: string[] = ['Français', 'Anglais', 'Allemand', 'Arabe', 'Italien', 'Espagnol'];
  levels: string[] = ['Débutant', 'Intermédiaire', 'Avancé', 'Courant', 'Langue Maternelle'];

  AjouterTitreDeProfil(): void {
    if (this.titreDeProfilControl.value) {
      sessionStorage.setItem("TitreProfile", this.titreDeProfilControl.value ?? '');
      this.authService.notifyProfileUpdate();
    } else if (!this.titreDeProfilControl.value) {
      this.showAlert('Attention', 'Veuillez saisir un titre pour votre profil', 'info');
      return;
    }
  
    const cvData: Partial<Cv> = {
      userId: this.userId!,
      titreDeProfil: this.titreDeProfilControl.value ?? undefined,
      id_cv: this.idCv ?? undefined
    };
  
    this.cvService.saveCv(this.userId!, cvData as Cv).subscribe({
      next: (res) => {
        this.completedSteps.add(2); // Mark step 2 as completed
        this.showAlert(
          'Succes !', 
          'Titre ajouté avec succès', 
          'success'
        );
        
        if (res.titreDeProfil) {
          this.titreDeProfilControl.setValue(res.titreDeProfil);
          this.cvService.cvUpdated.next({
            ...res,
            titreDeProfil: res.titreDeProfil
          });
        }
        
        if (res.id_cv && !this.idCv) {
          this.idCv = res.id_cv;
        }
      },
      error: (err) => {
        this.showAlert(
          'Erreur', 
          "Nous n'avons pas pu mettre à jour votre titre. Veuillez réessayer.", 
          'error'
        );
      }
    });
  }

  showAlert(title: string, message: string, type: 'success' | 'error' | 'info'): void {
    this.popupTitle = title;
    this.popupMessage = message;
    this.popupType = type;
    this.showPopup = true;
    
    // Masquer automatiquement après 5 secondes
    setTimeout(() => {
      this.showPopup = false;
    }, 5000);
  }
  
  // Ajoutez cette méthode pour fermer manuellement le popup
  closePopup(): void {
    this.showPopup = false;
  }
  
  private loadCvData(): void {
    if (!this.userId) return;
    
    this.cvService.getCvByUserId(this.userId).subscribe({
      next: (cv) => {
        if (cv) {
          this.idCv = cv.id_cv ?? null;
          this.populateForm(cv);
          
          if (cv.titreDeProfil) {
            this.titreDeProfilControl.setValue(cv.titreDeProfil);
          }
          
          // Met à jour les étapes si le backend en a
          if (cv.completedSteps && cv.completedSteps.length > 0) {
            const steps = new Set(
              cv.completedSteps.map((n: number) => (n === 4 ? 3 : n))
            );
            this.completedSteps = steps;
            if (this.userId) { // Vérification ajoutée
              this.stepTracker.updateCompletedSteps(steps, this.userId);
            }
          }
        }
      },
      error: (err) => console.error('Error loading CV:', err)
    });
  }

  onFinish(): void {
    if (!this.userId) {
      console.error('User ID is missing');
      return;
    }
  
    // Trouver les étapes manquantes
    const missingSteps = this.steps
      .filter(step => !this.completedSteps.has(step.number))
      .map(step => step.number);
  
    if (missingSteps.length === 0) {
      // Toutes les étapes sont complètes
      this.completedSteps.add(3);
      this.stepTracker.updateCompletedSteps(this.completedSteps, this.userId);
      
      Swal.fire({
        title: 'Félicitations !',
        text: 'Les informations que vous avez entrées se trouvent dans votre profil. Vous pouvez y accéder en cliquant sur OK.',
        icon: 'success',
        confirmButtonText: 'OK'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/profil']);
        }
      });
    } else {
      // Créer un message dynamique
      let missingStepsMessage = 'Pour accéder à votre profil, vous devez d\'abord terminer toutes les étapes.<br><br>';
      missingStepsMessage += '<strong>Étapes restantes :</strong><br><ul style="text-align: left; margin-left: 20px;">';
      
      missingSteps.forEach(step => {
        missingStepsMessage += `<li>Étape ${step}: ${this.steps.find(s => s.number === step)?.description}</li>`;
      });
      
      missingStepsMessage += '</ul><br>Veuillez compléter ces étapes avant de continuer.';
  
      Swal.fire({
        title: 'Étapes incomplètes',
        html: missingStepsMessage,
        icon: 'warning',
        confirmButtonText: 'Compris'
      });
    }
  }

  // Méthode pour le débogage
clearLocalStorage(): void {
  if (this.userId) {
    localStorage.removeItem(`completedSteps_${this.userId}`);
    this.completedSteps = new Set();
    this.stepTracker.updateCompletedSteps(this.completedSteps, this.userId);
    //console.log('LocalStorage cleared for user', this.userId);
  }
}
}
