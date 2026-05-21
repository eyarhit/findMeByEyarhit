import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { DocumentServiceService } from '../../services/document-service.service';
import Swal from 'sweetalert2';
import { StepTrackerService } from '../../services/step-tracker.service';
import { Subscription } from 'rxjs';

export interface SavedDocument {
  document: number;
  fileName: string;
  presignedUrl?: string;
}

@Component({
  selector: 'app-certif-diplome',
  templateUrl: './certif-diplome.component.html',
  styleUrls: ['./certif-diplome.component.scss']
})
export class CertifDiplomeComponent implements OnInit, OnDestroy {
  diplomaFilesSelected: File[] = [];
  certificateFilesSelected: File[] = [];
  savedDiplomas: SavedDocument[] = [];
  savedCertificates: SavedDocument[] = [];
  fileName: string = '';
  documentsUploaded = false;
  @Output() documentsValidated = new EventEmitter<boolean>();
  isLoading = false;
  private documentSub?: Subscription;
  private userId: number | null = null;

  constructor(
    private authService: AuthService,
    private documentService: DocumentServiceService,
    private stepTracker: StepTrackerService
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    this.loadSavedDocuments();
    this.documentSub = this.authService.documentUpdate$.subscribe(() => this.loadSavedDocuments());
  }

  ngOnDestroy(): void {
    this.documentSub?.unsubscribe();
  }

  loadSavedDocuments(): void {
    if (!this.userId) {
      return;
    }
    this.isLoading = true;
    let certsDone = false;
    let diplomasDone = false;

    const finish = () => {
      if (certsDone && diplomasDone) {
        this.isLoading = false;
        this.documentsUploaded =
          this.savedCertificates.length > 0 || this.savedDiplomas.length > 0;
        if (this.documentsUploaded) {
          this.documentsValidated.emit(true);
        }
      }
    };

    this.documentService.getDocumentsByUserAndFolder(this.userId, 'Certificat').subscribe({
      next: (response) => {
        this.savedCertificates = this.mapSavedDocuments(response);
        certsDone = true;
        finish();
      },
      error: () => {
        this.savedCertificates = [];
        certsDone = true;
        finish();
      }
    });

    this.documentService.getDocumentsByUserAndFolder(this.userId, 'Diplome').subscribe({
      next: (response) => {
        this.savedDiplomas = this.mapSavedDocuments(response);
        diplomasDone = true;
        finish();
      },
      error: () => {
        this.savedDiplomas = [];
        diplomasDone = true;
        finish();
      }
    });
  }

  private mapSavedDocuments(response: unknown): SavedDocument[] {
    if (!Array.isArray(response)) {
      return [];
    }
    return response.map((doc: { document: number; fileName: string; presignedUrl?: string }) => ({
      document: doc.document,
      fileName: doc.fileName,
      presignedUrl: doc.presignedUrl
    }));
  }

  onFileSelected(event: any, type: string): void {
    const files: FileList = event.target.files;
    const fileArray: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (this.isValidFileType(file)) {
        fileArray.push(file);
      } else {
        Swal.fire({
          title: 'Format invalide',
          text: 'Veuillez sélectionner uniquement des fichiers PDF ou des images (JPG, PNG, JPEG, etc.).',
          icon: 'warning',
          confirmButtonText: 'Compris',
          confirmButtonColor: '#6c63ff',
          background: '#fff8f0'
        });
        event.target.value = '';
        return;
      }
    }

    if (type === 'diploma') {
      this.diplomaFilesSelected = [...this.diplomaFilesSelected, ...fileArray];
    } else if (type === 'certificate') {
      this.certificateFilesSelected = [...this.certificateFilesSelected, ...fileArray];
    }

    event.target.value = '';
  }

  isValidFileType(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/gif',
      'image/bmp',
      'image/svg+xml'
    ];
    return allowedTypes.includes(file.type);
  }

  removeDiplomaFile(index: number): void {
    this.diplomaFilesSelected.splice(index, 1);
  }

  removeCertificateFile(index: number): void {
    this.certificateFilesSelected.splice(index, 1);
  }

  onUpload(): void {
    if (this.diplomaFilesSelected.length > 0) {
      const allFiles = [...this.diplomaFilesSelected];
      let uploadCount = 0;
      Swal.fire({
        text: 'Veuillez patienter pendant le téléchargement de vos diplômes.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading()
      });

      allFiles.forEach(file => {
        const fileName = this.fileName ? this.fileName : file.name;
        this.documentService.uploadDocument(file, fileName, "Diplome").subscribe(
          response => {
            uploadCount++;
            if (uploadCount === allFiles.length) {
              Swal.close();
              this.diplomaFilesSelected = [];
              this.documentsUploaded = true;
              this.documentsValidated.emit(true);
              this.authService.notifyDocumentUpdate();
              this.loadSavedDocuments();
              this.showSuccessAlert('🎓 Diplôme ajouté', 'Votre document a été importé avec succès.');
            }
          },
          error => {
            this.showErrorAlert('❌ Échec de l\'upload', 'Une erreur est survenue. Veuillez réessayer.');
          }
        );
      });
    }
  }

  onUploadCertif(): void {
    if (this.certificateFilesSelected.length > 0) {
      const allFiles = [...this.certificateFilesSelected];
      let uploadCount = 0;
      let hasError = false;
  
      Swal.fire({
        text: 'Veuillez patienter pendant le téléchargement de vos certificats.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading()
      });
  
      allFiles.forEach(file => {
        const fileName = this.fileName ? this.fileName : file.name;
        this.documentService.uploadDocument(file, fileName, "Certificat").subscribe({
          next: (response) => {
            uploadCount++;
            if (uploadCount === allFiles.length && !hasError) {
              Swal.close();
              this.certificateFilesSelected = [];
              this.documentsUploaded = true;
              this.documentsValidated.emit(true);
              this.authService.notifyDocumentUpdate();
              this.loadSavedDocuments();
              this.showSuccessAlert('📜 Certificat ajouté', 'Vos certificats ont bien été enregistrés.');
            }
          },
          error: (error) => {
            hasError = true;
            Swal.close();
            this.showErrorAlert('Oops...', 'Une erreur est survenue lors de l\'upload.');
          }
        });
      });
    }
  }

  onFinish(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.stepTracker.completeStep(userId, 3);
    }
    if (this.documentsUploaded) {
      Swal.fire({
        title: 'Étape terminée',
        text: 'Vos documents ont été enregistrés.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#6c63ff',
        timer: 2500,
      });
    }
  }

  private showSuccessAlert(title: string, text: string): void {
    Swal.fire({
      title,
      text,
      icon: 'success',
      confirmButtonText: 'Parfait !',
      confirmButtonColor: '#6c63ff'
    });
  }

  private showErrorAlert(title: string, text: string): void {
    Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonText: 'Réessayer',
      confirmButtonColor: '#ff4e4e'
    });
  }
}
