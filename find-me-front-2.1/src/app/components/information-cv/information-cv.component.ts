import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, AbstractControl } from '@angular/forms';
import { CvService } from '../../services/cv.service';
import { isPlatformBrowser } from '@angular/common';
import { jsPDF } from 'jspdf';
import { PdfService } from '../../services/pdf.service';
import { AuthService } from '../../services/auth.service';
import { Cv } from '../../_model/Cv';
import { Education } from '../../_model/Education';
import { Experience } from '../../_model/Experience';
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
import {
  buildFindMeCvFileName,
  displayNameFromStoredFileName,
  persistCvDisplayName,
  getSavedCvDisplayName,
  resolveCvDisplayName,
} from '../../shared/utils/cv-file-name.util';
import { AppValidators } from '../../shared/validators/app-validators';
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
        langageBallsage: ['', AppValidators.cvSkillsField],
        languageProgrammation: ['', AppValidators.cvSkillsField],
        framework: ['', AppValidators.cvSkillsField],
        bibliotheque: ['', AppValidators.cvSkillsField],
        api: ['', AppValidators.cvSkillsField],
        db: ['', AppValidators.cvSkillsField],
        systemExploitation: ['', AppValidators.cvSkillsField],
        conception: ['', AppValidators.cvSkillsField],
        methodologie: ['', AppValidators.cvSkillsField],
        designPattern: ['', AppValidators.cvSkillsField],
        architechture: ['', AppValidators.cvSkillsField],
        outils: ['', AppValidators.cvSkillsField],
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

    // Charge les données du CV
    this.loadCvData();
    this.restoreCvFileName();
    this.titreDeProfilControl.setValidators([AppValidators.cvProfileTitle]);
    this.fileNameControl.setValidators([AppValidators.cvFileName]);
  }

  /** Réaffiche le dernier nom saisi (session ou dernier CV CvFindMe en base). */
  private restoreCvFileName(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const saved = getSavedCvDisplayName();
    if (saved) {
      this.fileNameControl.setValue(saved);
      return;
    }
    if (!this.userId) {
      return;
    }
    this.documentService.getDocumentsByUserAndFolder(this.userId, 'CvFindMe').subscribe({
      next: (res) => {
        const doc = res?.document ?? res;
        const stored = doc?.fileName as string | undefined;
        if (stored) {
          const display = displayNameFromStoredFileName(stored);
          this.fileNameControl.setValue(display);
          persistCvDisplayName(display);
        }
      },
    });
  }

  private loadCompletedSteps(): void {
    if (this.userId) {
      this.stepTracker.loadCompletedSteps(this.userId);
      this.stepTracker.completedSteps$.subscribe((steps) => {
        this.completedSteps = new Set(steps);
        this.cdr.detectChanges();
      });
    }
  }

  private loadSteps(): void {
    if (!this.userId) return;
    
    this.stepTracker.completedSteps$.subscribe({
      next: (steps) => {
        this.completedSteps = new Set(steps);
        this.cdr.detectChanges();
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
    if (this.activeStep === 2) {
      this.publishCvPreview();
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
      if (Number.isNaN(date.getTime())) return '';
      return date.toISOString().substring(0, 10);
    };

    this.academicFormations.push(this.fb.group({
      university: [data?.university || '', AppValidators.cvEducationUniversity],
      diplome: [data?.diplome || '', AppValidators.cvEducationDiplome],
      dateDebut: [formatDate(data?.dateDebut), AppValidators.cvEducationDateDebut],
      dateFin: [formatDate(data?.dateFin), AppValidators.cvEducationDateFin],
    }, { validators: AppValidators.cvEducationDateRange }));
    this.setupAcademicDateRevalidation(this.academicFormations.length - 1);
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
      entreprise: [data?.entreprise || '', AppValidators.cvExperienceEntreprise],
      dateDebut: [formatDate(data?.dateDebut), AppValidators.cvExperienceDateDebut],
      dateFin: [formatDate(data?.dateFin), AppValidators.cvExperienceDateFin],
      poste: [data?.poste || '', AppValidators.cvExperiencePoste],
      nomProjet: [data?.nomProjet || '', AppValidators.cvExperienceOptionalText(2)],
      client: [data?.client || '', AppValidators.cvExperienceOptionalText(5)],
      equipe: [data?.equipe || '', AppValidators.cvExperienceOptionalText(5)],
      description: [desc, AppValidators.cvExperienceOptionalText(10)],
      travailRealise: [data?.travailRealise || desc, AppValidators.cvExperienceOptionalText(10)],
      environnement: [data?.environnement || '', AppValidators.cvSkillsField],
    }, { validators: AppValidators.cvExperienceDateRange }));
    this.setupExperienceDateRevalidation(this.professionalExperiences.length - 1);
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
        name: [name, AppValidators.cvLanguageName],
        niveau: [niveau, AppValidators.cvLanguageLevel],
      })
    );
  }

  private setupAcademicDateRevalidation(index: number): void {
    const group = this.academicFormations.at(index) as FormGroup;
    group.get('dateDebut')?.valueChanges.subscribe(() => {
      group.get('dateFin')?.updateValueAndValidity({ emitEvent: false });
      group.updateValueAndValidity({ emitEvent: false });
    });
    group.get('dateFin')?.valueChanges.subscribe(() => {
      group.updateValueAndValidity({ emitEvent: false });
    });
  }

  private setupExperienceDateRevalidation(index: number): void {
    const group = this.professionalExperiences.at(index) as FormGroup;
    group.get('dateDebut')?.valueChanges.subscribe(() => {
      group.get('dateFin')?.updateValueAndValidity({ emitEvent: false });
      group.updateValueAndValidity({ emitEvent: false });
    });
    group.get('dateFin')?.valueChanges.subscribe(() => {
      group.updateValueAndValidity({ emitEvent: false });
    });
  }

  showCvError(control: AbstractControl | null, group?: AbstractControl | null): boolean {
    if (!control) {
      return false;
    }
    const touched = control.dirty || control.touched;
    if (control.invalid && touched) {
      return true;
    }
    if (group?.errors?.['cvDateRange'] && group instanceof FormGroup) {
      const dateTouched =
        touched ||
        group.get('dateDebut')?.touched ||
        group.get('dateFin')?.touched ||
        group.get('dateDebut')?.dirty ||
        group.get('dateFin')?.dirty;
      if (dateTouched) {
        return true;
      }
    }
    return false;
  }

  getCvErrorMessage(control: AbstractControl | null, group?: AbstractControl | null): string {
    if (control?.errors) {
      for (const key of Object.keys(control.errors)) {
        const payload = control.errors[key];
        if (payload?.message) {
          return payload.message;
        }
      }
    }
    if (group?.errors?.['cvDateRange']?.message) {
      return group.errors['cvDateRange'].message;
    }
    return 'Valeur invalide';
  }

  private markFormArrayTouched(array: FormArray): void {
    array.controls.forEach((ctrl) => {
      if (ctrl instanceof FormGroup) {
        Object.values(ctrl.controls).forEach((c) => c.markAsTouched());
        ctrl.markAsTouched();
      } else {
        ctrl.markAsTouched();
      }
    });
  }

  private validateStep1Page1(): boolean {
    this.markFormArrayTouched(this.academicFormations);
    this.form.get('technicalSkills')?.markAllAsTouched();
    const academicValid = this.academicFormations.controls.every((c) => c.valid);
    const skillsValid = this.form.get('technicalSkills')?.valid ?? true;
    return academicValid && skillsValid;
  }

  private validateStep1Page2(): boolean {
    this.markFormArrayTouched(this.professionalExperiences);
    this.markFormArrayTouched(this.languages);
    const expValid = this.professionalExperiences.controls.every((c) => c.valid);
    const langValid = this.languages.controls.every((c) => c.valid);
    return expValid && langValid;
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

  /** Fusionne la réponse API avec le formulaire (évite d’effacer les compétences extraites). */
  private mergeCvResponse(api: Cv, local: Cv): Cv {
    return {
      ...api,
      titreDeProfil: api.titreDeProfil ?? local.titreDeProfil,
      competences: this.hasCompetenceData(api.competences) ? api.competences : local.competences,
      educations: api.educations?.length ? api.educations : local.educations,
      experiences: api.experiences?.length ? api.experiences : local.experiences,
      langues: api.langues?.length ? api.langues : local.langues,
    };
  }

  private hasCompetenceData(competences: Cv['competences'] | undefined): boolean {
    if (!competences?.length) {
      return false;
    }
    const c = competences[0];
    return !!(
      c.langageBallsage ||
      c.languageProgrammation ||
      c.framework ||
      c.bibliotheque ||
      c.api ||
      c.db ||
      c.systemExploitation ||
      c.conception ||
      c.methodologie ||
      c.designPattern ||
      c.architechture ||
      c.outils
    );
  }

  private filterFilledAcademicFormations(items: unknown[]): Education[] {
    return items
      .filter((e) => this.rowHasAcademicData(e as Record<string, unknown>))
      .map((e) => this.mapAcademicRow(e as Record<string, unknown>));
  }

  private filterFilledProfessionalExperiences(items: unknown[]): Experience[] {
    return items
      .filter((e) => this.rowHasProfessionalData(e as Record<string, unknown>))
      .map((e) => this.mapProfessionalRow(e as Record<string, unknown>));
  }

  private filterFilledLanguages(items: unknown[]): Langue[] {
    return items
      .filter((e) => this.rowHasLanguageData(e as Record<string, unknown>))
      .map((e) => this.mapLanguageRow(e as Record<string, unknown>));
  }

  private rowHasAcademicData(e: Record<string, unknown>): boolean {
    const u = String(e['university'] ?? '').trim();
    const d = String(e['diplome'] ?? '').trim();
    return !!(u || d || e['dateDebut'] || e['dateFin']);
  }

  private rowHasProfessionalData(e: Record<string, unknown>): boolean {
    const ent = String(e['entreprise'] ?? '').trim();
    const poste = String(e['poste'] ?? '').trim();
    const desc = String(e['description'] ?? e['travailRealise'] ?? '').trim();
    return !!(
      ent ||
      poste ||
      desc ||
      e['dateDebut'] ||
      e['dateFin'] ||
      String(e['nomProjet'] ?? '').trim() ||
      String(e['client'] ?? '').trim()
    );
  }

  private rowHasLanguageData(e: Record<string, unknown>): boolean {
    const name = normalizeLanguageName(e['name'] ?? e['language'] ?? e['langue'] ?? '');
    const niveau = normalizeLanguageLevel(e['niveau'] ?? e['proficiency'] ?? e['level'] ?? '');
    return !!(name || niveau);
  }

  private mapAcademicRow(e: Record<string, unknown>): Education {
    const formatDate = (v: unknown) => {
      if (!v) return '';
      const s = String(v);
      if (!s) return '';
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? '' : d.toISOString().substring(0, 10);
    };
    return {
      university: String(e['university'] ?? ''),
      diplome: String(e['diplome'] ?? ''),
      dateDebut: formatDate(e['dateDebut']),
      dateFin: formatDate(e['dateFin']),
    };
  }

  private mapProfessionalRow(e: Record<string, unknown>): Experience {
    const formatDate = (v: unknown) => {
      if (!v) return '';
      const s = String(v);
      if (!s) return '';
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? '' : d.toISOString().substring(0, 10);
    };
    const desc = String(e['description'] ?? e['travailRealise'] ?? '');
    return {
      entreprise: String(e['entreprise'] ?? ''),
      dateDebut: formatDate(e['dateDebut']),
      dateFin: formatDate(e['dateFin']),
      poste: String(e['poste'] ?? ''),
      nomProjet: String(e['nomProjet'] ?? ''),
      client: String(e['client'] ?? ''),
      equipe: String(e['equipe'] ?? ''),
      description: desc,
      travailRealise: String(e['travailRealise'] ?? desc),
      environnement: String(e['environnement'] ?? ''),
    };
  }

  private mapLanguageRow(e: Record<string, unknown>): Langue {
    return {
      name: normalizeLanguageName(e['name'] ?? e['language'] ?? e['langue'] ?? ''),
      niveau: normalizeLanguageLevel(e['niveau'] ?? e['proficiency'] ?? e['level'] ?? ''),
    };
  }

  // Form Submission
  onSubmit(): void {
    if (!this.userId) {
      if (this.activeStep === 1) {
        this.showAlert('Erreur', 'userId non trouvé !', 'error');
      }
      return;
    }

    if (!this.validateStep1Page1() || !this.validateStep1Page2()) {
      this.showAlert('Erreur', 'Veuillez corriger les erreurs dans le formulaire CV.', 'error');
      return;
    }

    const cvData = this.buildCvPayload();
  
    const currentStep = this.activeStep;
  
    this.cvService.saveCv(this.userId, cvData).subscribe(
      (response: Cv) => {
        if (currentStep === 1) {
          this.markStepCompleted(1);
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
  

  /**
   * Vert + coche : etapes precedentes, ou etape courante apres « Confirme » (ex. etape 3).
   */
  isStepVisuallyCompleted(stepNumber: number): boolean {
    if (stepNumber < this.activeStep) {
      return true;
    }
    return (
      stepNumber === this.activeStep && this.completedSteps.has(stepNumber)
    );
  }

  private markStepCompleted(stepNumber: number): void {
    if (this.completedSteps.has(stepNumber)) {
      return;
    }
    const next = new Set(this.completedSteps);
    next.add(stepNumber);
    this.completedSteps = next;
    if (this.userId) {
      this.stepTracker.updateCompletedSteps(next, this.userId);
    }
    this.cdr.detectChanges();
  }

  /** Etape 3 diplomes/certificats : bouton « Confirme ! » dans certif-diplome. */
  onStep3Confirmed(): void {
    this.markStepCompleted(3);
  }

  goToStep(stepNumber: number): void {
    if (stepNumber < 1 || stepNumber > this.steps.length) {
      return;
    }

    const previousStep = this.activeStep;
    if (stepNumber > previousStep) {
      if (previousStep === 1) {
        if (this.currentPage === 1 && stepNumber > 1) {
          if (!this.validateStep1Page1()) {
            this.showAlert('Erreur', 'Veuillez corriger les formations et compétences.', 'error');
            return;
          }
          this.showAlert('Erreur', 'Complétez d\'abord la page expériences et langues.', 'error');
          return;
        }
        if (!this.validateStep1Page1() || !this.validateStep1Page2()) {
          this.showAlert('Erreur', 'Veuillez corriger les erreurs du formulaire CV.', 'error');
          return;
        }
      }
      for (let s = previousStep; s < stepNumber; s++) {
        this.markStepCompleted(s);
      }
      if (previousStep === 1) {
        this.saveCvSilent();
      }
    }

    this.activeStep = stepNumber;
    this.currentPage = 1;

    if (stepNumber === 2) {
      this.publishCvPreview();
    }
  }

  /** Alimente la prévisualisation avec le formulaire (données extraites du CV). */
  publishCvPreview(): void {
    if (!this.userId) {
      return;
    }
    const payload = this.buildCvPayload();
    const titre = (this.titreDeProfilControl.value ?? '').toString().trim();
    if (titre) {
      payload.titreDeProfil = titre;
    }
    this.cvService.publishPreviewCv(payload);
  }

  goToNextPage(): void {
    if (this.activeStep === 1 && this.currentPage === 1) {
      if (!this.validateStep1Page1()) {
        this.showAlert('Erreur', 'Veuillez corriger les formations et compétences.', 'error');
        return;
      }
      this.currentPage = 2;
    } else if (this.activeStep === 1 && this.currentPage === 2) {
      if (!this.validateStep1Page2()) {
        this.showAlert('Erreur', 'Veuillez corriger les expériences et langues.', 'error');
        return;
      }
      this.markStep1Complete();
      this.goToStep(2);
    } else {
      this.goToStep(this.activeStep + 1);
    }
  }

  /** Étape 1 : validation avant passage à l'étape 2. */
  private markStep1Complete(): void {
    this.markStepCompleted(1);
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
        const merged = this.mergeCvResponse(response, cvData);
        this.cvService.publishPreviewCv(merged);
        this.cvService.cvUpdated.next(merged);
      },
      error: () => {
        /* navigation autorisée même si l’API échoue */
        if (this.activeStep === 2) {
          this.publishCvPreview();
        }
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

      const userName = await this.authService.getUserFullName();
      const displayName = resolveCvDisplayName(this.fileNameControl.value, userName);
      const fileName = buildFindMeCvFileName(displayName);

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
fileNameControl = new FormControl('', [AppValidators.cvFileName]);
isSaving = false;

// Replace the existing SauvegarderCV method with this:
async SauvegarderCV(): Promise<void> {
  this.fileNameControl.markAsTouched();
  if (this.isSaving || !this.fileNameControl.valid) {
    this.showNotification(
      this.fileNameControl.invalid
        ? (this.getCvErrorMessage(this.fileNameControl) || 'Veuillez entrer un nom de fichier valide')
        : 'Opération déjà en cours',
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
    const displayName = resolveCvDisplayName(this.fileNameControl.value, null);
    const fileName = buildFindMeCvFileName(displayName);

    const pdfBlob = await this.pdfService.SauvegarderMultiPagePdf(element, fileName);

    await this.uploadDocument(pdfBlob, fileName);

    persistCvDisplayName(displayName);
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
    this.titreDeProfilControl.markAsTouched();
    if (!String(this.titreDeProfilControl.value ?? '').trim()) {
      this.showAlert('Attention', 'Veuillez saisir un titre pour votre profil', 'info');
      return;
    }
    if (this.titreDeProfilControl.invalid) {
      this.showAlert(
        'Attention',
        this.getCvErrorMessage(this.titreDeProfilControl) || 'Veuillez saisir un titre valide pour votre profil',
        'info'
      );
      return;
    }
    sessionStorage.setItem("TitreProfile", this.titreDeProfilControl.value ?? '');
    this.authService.notifyProfileUpdate();
  
    const cvData: Partial<Cv> = {
      userId: this.userId!,
      titreDeProfil: this.titreDeProfilControl.value ?? undefined,
      id_cv: this.idCv ?? undefined
    };
  
    this.cvService.saveCv(this.userId!, cvData as Cv).subscribe({
      next: (res) => {
        this.markStepCompleted(2);
        this.showAlert(
          'Succes !', 
          'Titre ajouté avec succès', 
          'success'
        );
        
        if (res.titreDeProfil) {
          this.titreDeProfilControl.setValue(res.titreDeProfil);
          const merged = this.mergeCvResponse(res, this.buildCvPayload());
          this.cvService.publishPreviewCv(merged);
          this.cvService.cvUpdated.next(merged);
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
          this.completedSteps = steps;
          if (steps.size > 0) {
            const max = Math.max(...Array.from(steps));
            this.activeStep = Math.min(max + 1, this.steps.length);
          } else {
            this.activeStep = 1;
          }
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

    this.markStepCompleted(3);
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