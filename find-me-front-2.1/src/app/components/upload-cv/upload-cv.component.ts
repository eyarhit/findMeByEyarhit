import { Component, ElementRef, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { CvService } from '../../services/cv.service';
import { Router } from '@angular/router';
import { apiRoutingServiceFlusk } from '../../services/api-routing-flusk.services';
import { AuthService } from '../../services/auth.service';
import { Cv } from '../../_model/Cv';
import {
  CvParseValidationService,
  ParseCVResponse,
} from '../../services/cv-parse-validation.service';

@Component({
  selector: 'app-upload-cv',
  templateUrl: './upload-cv.component.html',
  styleUrls: ['./upload-cv.component.scss'],
})
export class UploadCvComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;
  selectedFile: File | null = null;
  isLoading = false;
  errorMessage = '';
  parseWarnings: string[] = [];
  parsedData: ReturnType<UploadCvComponent['transformResponse']> | null = null;
  parseMetadata: ParseCVResponse['metadata'] | null = null;
  userId: number | null = null;
  idCv: number | null = null;
  uploadProgress = 0;
  private progressInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private authService: AuthService,
    private cvService: CvService,
    @Inject(PLATFORM_ID) private platformId: object,
    private router: Router,
    private apiRoutingServiceFlusk: apiRoutingServiceFlusk,
    private parseValidation: CvParseValidationService
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    if (!this.userId) {
      console.error('userId manquant dans le token');
      return;
    }
    this.loadCv(this.userId);
  }

  loadCv(userId: number): void {
    this.cvService.getCvByUserId(userId).subscribe((cv) => {
      this.idCv = cv?.id_cv ?? null;
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  saveModal(): void {
    if (!this.selectedFile) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.parseWarnings = [];
    this.uploadProgress = 0;
    this.simulateProgress();

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.apiRoutingServiceFlusk.requestApi('/parse-cv/', formData).subscribe({
      next: (response: ParseCVResponse) => {
        clearInterval(this.progressInterval!);
        this.uploadProgress = 100;
        this.parseMetadata = response.metadata ?? null;
        this.parseWarnings = [
          ...(response.metadata?.warnings ?? []),
          ...(response.validation?.issues
            ?.filter((i) => i.severity === 'warning')
            .map((i) => i.message) ?? []),
        ];

        const gate = this.parseValidation.canSaveToDatabase(response);
        if (!gate.allowed) {
          this.isLoading = false;
          this.errorMessage = gate.messages.join(' ');
          return;
        }

        if (!response.validation?.can_save) {
          this.isLoading = false;
          this.errorMessage =
            response.validation?.issues?.find((i) => i.severity === 'error')?.message ??
            'Extraction insuffisante — utilisez un PDF texte ou saisissez manuellement.';
          return;
        }

        try {
          const payload = response.data ?? (response as unknown as ParseCVResponse['data']);
          this.parsedData = this.transformResponse(payload);
          this.onSave(response);
        } catch {
          this.errorMessage = 'Erreur lors de l\'analyse du CV';
          this.isLoading = false;
        }
      },
      error: (err) => {
        clearInterval(this.progressInterval!);
        this.isLoading = false;
        this.errorMessage =
          err?.error?.detail ?? 'Une erreur est survenue lors du téléchargement';
      },
    });
  }

  private simulateProgress(): void {
    this.progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += Math.floor(Math.random() * 10) + 1;
      }
    }, 500);
  }

  onSave(response: ParseCVResponse): void {
    if (!this.userId) {
      alert('Erreur : userId non trouvé');
      return;
    }

    const transformed = this.transformResponse(response.data);
    const cvData: Cv = {
      id_cv: this.idCv ?? undefined,
      userId: this.userId,
      titreDeProfil: transformed.titreDeProfil,
      competences: [transformed.competencesTechniques],
      educations: transformed.education,
      experiences: transformed.workExperiences,
      langues: transformed.langues,
    };

    this.cvService.saveCv(this.userId, cvData).subscribe({
      next: () => {
        this.isLoading = false;
        if (transformed.projects.length) {
          sessionStorage.setItem(
            'cv_import_projects',
            JSON.stringify(transformed.projects)
          );
        }
        this.router.navigate(['/cv/remplir']);
      },
      error: () => {
        this.isLoading = false;
        alert('Erreur lors de l\'enregistrement du CV.');
      },
    });
  }

  private safeJoin(arr: unknown): string {
    if (!Array.isArray(arr)) return '';
    return arr.filter(Boolean).join(', ');
  }

  private transformResponse(data: ParseCVResponse['data']) {
    const ts = (data?.technical_skills ?? {}) as Record<string, unknown>;
    const pi = data?.personal_info;

    return {
      titreDeProfil: pi?.job_title ?? '',
      personalInfo: pi,
      education:
        data?.education?.map((edu) => ({
          diplome: edu.degree ?? '',
          university: edu.institution ?? '',
          dateDebut: edu.start_date ?? '',
          dateFin: edu.end_date ?? '',
        })) ?? [],

      competencesTechniques: {
        db: this.safeJoin(ts['databases']),
        systemExploitation: this.safeJoin(ts['operating_systems']),
        outils: this.safeJoin(ts['tools']),
        languageProgrammation: this.safeJoin(ts['programming_languages']),
        framework: this.safeJoin(ts['frameworks']),
        api: this.safeJoin(ts['apis']),
        architechture: this.safeJoin(ts['architectures']),
        conception: this.safeJoin(ts['design']),
        designPattern: this.safeJoin(ts['design_patterns']),
        bibliotheque: this.safeJoin(ts['libraries']),
        langageBallsage: this.safeJoin(ts['markup_languages']),
        methodologie: this.safeJoin(ts['methodologies']),
      },

      langues:
        data?.languages?.map((lang) => ({
          name: lang.language ?? '',
          niveau: lang.proficiency ?? '',
        })) ?? [],

      workExperiences:
        data?.work_experiences
          ?.filter((w) => w.position || w.company)
          .map((w) => ({
            poste: w.position ?? '',
            entreprise: w.company ?? '',
            dateDebut: w.start_date ?? '',
            dateFin: w.end_date ?? '',
            description: w.description ?? '',
            nomProjet: '',
            client: '',
            equipe: '',
            travailRealise: '',
            environnement: '',
          })) ?? [],

      projects:
        data?.projects?.map((p) => ({
          nomProjet: p.title ?? '',
          client: p.client_name ?? '',
          entreprise: '',
          equipe: p.team_composition ?? '',
          dateDebut: p.start_date ?? '',
          dateFin: p.end_date ?? '',
        })) ?? [],
    };
  }

  isDragging = false;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const file = event.dataTransfer?.files[0];
    if (file?.type === 'application/pdf') {
      this.selectedFile = file;
      const list = new DataTransfer();
      list.items.add(file);
      this.onFileSelected({ target: { files: list.files } } as unknown as Event);
    } else {
      this.errorMessage = 'Seuls les fichiers PDF sont acceptés.';
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.errorMessage = '';
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
