import { Component, Output, EventEmitter  } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { DocumentServiceService } from '../../services/document-service.service';
import Swal from 'sweetalert2';
import { StepTrackerService } from '../../services/step-tracker.service';

@Component({
  selector: 'app-certif-diplome',
  templateUrl: './certif-diplome.component.html',
  styleUrls: ['./certif-diplome.component.scss']
})
export class CertifDiplomeComponent {
  diplomaFilesSelected: File[] = [];
  certificateFilesSelected: File[] = [];
  fileName: string = '';
  documentsUploaded = false; 
  @Output() documentsValidated = new EventEmitter<boolean>();
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private documentService: DocumentServiceService,
    private stepTracker: StepTrackerService

  ) {}

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
              this.documentsUploaded = true;
              this.documentsValidated.emit(true);
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
              this.documentsUploaded = true;
              this.documentsValidated.emit(true);
              this.showSuccessAlert('📜 Certificat ajouté', 'Vos certificats ont bien été enregistrés.');
              this.certificateFilesSelected = [];
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
    if (this.documentsUploaded) {
      const userId = this.authService.getUserId();
      if (userId) {
        this.stepTracker.completeStep(userId, 3); // Étape diplômes / certificats (parcours 3 étapes)
        Swal.fire({
          title: '✅ Étape terminée',
          text: 'Vos documents ont été validés avec succès.',
          icon: 'success',
          confirmButtonText: 'Continuer',
          confirmButtonColor: '#6c63ff'
        });
      }
    } else {
      Swal.fire({
        title: 'Documents requis',
        text: 'Veuillez importer au moins un diplôme ou certificat avant de terminer.',
        icon: 'warning',
        confirmButtonText: 'Compris',
        confirmButtonColor: '#6c63ff'
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
