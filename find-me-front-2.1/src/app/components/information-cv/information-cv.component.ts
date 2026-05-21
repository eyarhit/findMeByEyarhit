import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { CvService } from '../../services/cv.service';
import { isPlatformBrowser } from '@angular/common';
import { jsPDF } from 'jspdf';
import { PdfService } from '../../services/pdf.service';
import { AuthService } from '../../services/auth.service';
import { Cv } from '../../_model/Cv';
import { Langue } from '../../_model/Langue';
import { ChangeDetectorRef } from '@angular/core';
import { StepTrackerService } from '../../services/step-tracker.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { DocumentServiceService } from '../../services/document-service.service';
import {
  LANGUAGE_LEVEL_OPTIONS,
  LANGUAGE_NAME_OPTIONS,
  normalizeLanguageLevel,
  normalizeLanguageName,
} from '../../shared/constants/form-options';
@Component({
  selector: 'app-information-cv', 
  templateUrl: './information-cv.component.html',
  styleUrls: ['./information-cv.component.scss']
})
export class InformationCvComponent implements OnInit {
  form: FormGroup;
  activeStep = 1;
  currentPage = 1;
  userId: number | null = null; 
  idCv: number | null = null;
  titreDeProfilControl = new FormControl('');
  completedSteps: Set<number> = new Set();
  email:string='';


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
    // Étape CodingGame désactivée pour le moment (non obligatoire)
    // { number: 3, description: 'CodingGame', icon: 'fa-gamepad' },
    { number: 3, description: 'Diplômes et Certificats', icon: 'fa-certificate' },
  ];

  constructor(
    private documentService:DocumentServiceService,
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
    this.email=this.authService.getEmail()!;
  
    if (!this.userId) {
      console.error("User ID not found");
      return;
    }

    // Charge les étapes AVANT les données du CV
    this.loadSteps();

    // Étape 1 non bloquante : marquer dès l’ouverture du parcours CV
    this.completedSteps.add(1);
    if (this.userId) {
      this.stepTracker.updateCompletedSteps(this.completedSteps, this.userId);
    }

    // Charge les données du CV
    this.loadCvData();
    this.restoreCvFileName();
  }

  private static readonly CV_FILE_NAME_KEY = 'cv_findme_display_name';

  /** Réaffiche le dernier nom saisi (persisté après sauvegarde réussie). */
  private restoreCvFileName(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const saved = sessionStorage.getItem(InformationCvComponent.CV_FILE_NAME_KEY);
    if (saved) {
      this.fileNameControl.setValue(saved);
    }
  }

  private persistCvFileName(displayName: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    sessionStorage.setItem(InformationCvComponent.CV_FILE_NAME_KEY, displayName);
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
    this.academicFormations.clear();
    this.professionalExperiences.clear();
    this.languages.clear();

    if (cv.titreDeProfil) {
      this.titreDeProfilControl.setValue(cv.titreDeProfil);
    }

    if (cv.competences?.length) {
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
          outils: competence.outils || '',
        },
      });
    }

    (cv.educations ?? []).forEach((edu) => this.addAcademicFormation(edu));
    (cv.experiences ?? []).forEach((exp) => this.addProfessionalExperience(exp));
    (cv.langues ?? []).forEach((lang) => {
      const ext = lang as Langue & {
        language?: string;
        proficiency?: string;
        level?: string;
        langue?: string;
      };
      const name = normalizeLanguageName(
        ext.name ?? ext.language ?? ext.langue ?? ''
      );
      const niveau = normalizeLanguageLevel(
        ext.niveau ?? ext.proficiency ?? ext.level ?? ''
      );
      if (name || niveau) {
        this.addLanguage({ name, niveau });
      }
    });
    this.cdr.detectChanges();
  }

  // Academic Formations
  get academicFormations(): FormArray {
    return this.form.get('academicFormations') as FormArray;
  }

  addAcademicFormation(data?: any): void {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return '';
      return date.toISOString().substring(0, 10);
    };

    this.academicFormations.push(this.fb.group({
      university: [data?.university || '', Validators.maxLength(120)],
      diplome: [data?.diplome || '', Validators.maxLength(120)],
      dateDebut: [formatDate(data?.dateDebut)],
      dateFin: [formatDate(data?.dateFin)],
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
  
    const desc = data?.description || data?.travailRealise || '';
    this.professionalExperiences.push(this.fb.group({
      entreprise: [data?.entreprise || ''],
      dateDebut: [formatDate(data?.dateDebut)],
      dateFin: [formatDate(data?.dateFin)],
      poste: [data?.poste || ''],
      nomProjet: [data?.nomProjet || ''],
      client: [data?.client || ''],
      equipe: [data?.equipe || ''],
      description: [desc],
      travailRealise: [data?.travailRealise || desc],
      environnement: [data?.environnement || ''],
    }));
  }
  

  removeProfessionalExperience(index: number): void {
    this.professionalExperiences.removeAt(index);
  }

  // Languages
  get languages(): FormArray {
    return this.form.get('languages') as FormArray;
  }

  addLanguage(data?: Record<string, unknown>): void {
    const raw = data ?? {};
    const name = normalizeLanguageName(
      raw['name'] ?? raw['language'] ?? raw['langue'] ?? ''
    );
    const niveau = normalizeLanguageLevel(
      raw['niveau'] ?? raw['proficiency'] ?? raw['level'] ?? ''
    );
    this.languages.push(
      this.fb.group({
        name: [name],
        niveau: [niveau],
      })
    );
  }

  removeLanguage(index: number): void {
    this.languages.removeAt(index);
  }

  /** Ignore les lignes vides (formulaire partiel autorisé à l’étape 1). */
  private buildCvPayload(): Cv {
    const technicalSkillsData = this.form.value.technicalSkills;
    return {
      id_cv: this.idCv ?? undefined,
      userId: this.userId!,
      competences: [technicalSkillsData],
      educations: this.filterFilledAcademicFormations(
        this.form.value.academicFormations || []
      ),
      experiences: this.filterFilledProfessionalExperiences(
        this.form.value.professionalExperiences || []
      ),
      langues: this.filterFilledLanguages(this.form.value.languages || []),
    };
  }

  private filterFilledAcademicFormations(items: Record<string, unknown>[]): Record<string, unknown>[] {
    return items.filter((e) => {
      const u = String(e['university'] ?? '').trim();
      const d = String(e['diplome'] ?? '').trim();
      return u || d || e['dateDebut'] || e['dateFin'];
    });
  }

  private filterFilledProfessionalExperiences(items: Record<string, unknown>[]): Record<string, unknown>[] {
    return items.filter((e) => {
      const ent = String(e['entreprise'] ?? '').trim();
      const poste = String(e['poste'] ?? '').trim();
      const desc = String(e['description'] ?? e['travailRealise'] ?? '').trim();
      return (
        ent ||
        poste ||
        desc ||
        e['dateDebut'] ||
        e['dateFin'] ||
        String(e['nomProjet'] ?? '').trim() ||
        String(e['client'] ?? '').trim()
      );
    });
  }

  private filterFilledLanguages(items: Record<string, unknown>[]): Record<string, unknown>[] {
    return items
      .map((l) => ({
        name: normalizeLanguageName(l['name'] ?? ''),
        niveau: normalizeLanguageLevel(l['niveau'] ?? ''),
      }))
      .filter((l) => l.name || l.niveau);
  }

  // Form Submission
  onSubmit(): void {
    if (!this.userId) {
      if (this.activeStep === 1) {
        this.showAlert('Erreur', 'userId non trouvé !', 'error');
      }
      return;
    }

    const cvData = this.buildCvPayload();
  
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
      if (stepNumber > 1) {
        this.completedSteps.add(1);
      }
      if (stepNumber >= 3) {
        this.completedSteps.add(2);
      }
      if (this.userId) {
        this.stepTracker.updateCompletedSteps(this.completedSteps, this.userId);
      }
      if (this.activeStep === 1 && stepNumber > 1) {
        this.saveCvSilent();
      }
      this.activeStep = stepNumber;
      this.currentPage = 1;
    }
  }

  goToNextPage(): void {
    if (this.activeStep === 1 && this.currentPage === 1) {
      this.currentPage = 2;
    } else if (this.activeStep === 1 && this.currentPage === 2) {
      this.markStep1Complete();
      this.goToStep(2);
    } else {
      this.goToStep(this.activeStep + 1);
    }
  }

  /** Étape 1 : navigation libre sans champs obligatoires. */
  private markStep1Complete(): void {
    this.completedSteps.add(1);
    if (this.userId) {
      this.stepTracker.updateCompletedSteps(this.completedSteps, this.userId);
    }
    this.saveCvSilent();
  }

  private saveCvSilent(): void {
    if (!this.userId) return;
    const cvData = this.buildCvPayload();
    this.cvService.saveCv(this.userId, cvData).subscribe({
      next: (response: Cv) => {
        if (response.id_cv && !this.idCv) {
          this.idCv = response.id_cv;
        }
      },
      error: () => {
        /* navigation autorisée même si l’API échoue */
      },
    });
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

// Add to your component class properties
fileNameControl = new FormControl('', Validators.required);
isSaving = false;

// Replace the existing SauvegarderCV method with this:
async SauvegarderCV(): Promise<void> {
  if (this.isSaving || !this.fileNameControl.valid) {
    this.showNotification(
      this.fileNameControl.invalid ? 'Veuillez entrer un nom de fichier valide' : 'Opération déjà en cours',
      'error'
    );
    return;
  }

  this.isSaving = true;
  const element = document.getElementById('cv-content');

  try {
    if (!element) {
      throw new Error('Élément CV non trouvé');
    }

    element.classList.add('pdf-export-mode');
    const displayName = String(this.fileNameControl.value ?? '').trim();
    const fileName = `FIND ME-${displayName}`.replace(/\s+/g, '.');

    // Generate PDF
    const pdfBlob = await this.pdfService.SauvegarderMultiPagePdf(element, fileName);
    
    // Upload document
    await this.uploadDocument(pdfBlob, fileName);
    
    this.persistCvFileName(displayName);
    this.showNotification('CV généré et sauvegardé avec succès!', 'success');
    
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    this.showNotification(
      error instanceof Error ? error.message : 'Erreur lors de la sauvegarde du PDF',
      'error'
    );
  } finally {
    if (element) {
      element.classList.remove('pdf-export-mode');
    }
    this.isSaving = false;
  }
}

// Update your uploadDocument method
private async uploadDocument(pdfBlob: Blob, fileName: string): Promise<void> {
  try {
    const file = new File([pdfBlob], `${fileName}.pdf`, { type: 'application/pdf' });
    
    await this.documentService.uploadDocument(
      file, 
      fileName,
      "CvFindMe",
      this.email
    ).toPromise();
    
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    throw new Error('Échec de l\'envoi du document');
  }
}
  languageList: string[] = LANGUAGE_NAME_OPTIONS.map((o) => o.value);
  levels: string[] = LANGUAGE_LEVEL_OPTIONS.map((o) => o.value);

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
          const steps = new Set(
            (cv.completedSteps ?? []).map((n: number) => (n === 4 ? 3 : n))
          );
          steps.add(1);
          this.completedSteps = steps;
          if (this.userId) {
            this.stepTracker.updateCompletedSteps(steps, this.userId);
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

    this.completedSteps = new Set(this.steps.map((s) => s.number));
    this.stepTracker.updateCompletedSteps(this.completedSteps, this.userId);
    this.saveCvSilent();

    this.showNotification('Parcours CV terminé.', 'success');
    this.router.navigate(['/profil']);
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