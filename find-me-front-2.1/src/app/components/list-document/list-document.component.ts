import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentServiceService } from '../../services/document-service.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-list-document',
  templateUrl: './list-document.component.html',
  styleUrls: ['./list-document.component.scss']
})
export class ListDocumentComponent implements OnInit {
   @Input() typedocument: string ='';
     @Input() profileId : number | null = null;
      @Input() profilerole : string ='';
  private subscription?: Subscription;
  showPdf = false;
  sanitizedPdfSrc!: SafeResourceUrl;
  userId: number | null = null;
  documents: any[] = [];
  selectedDocument: any = null;
  
  // Propriétés pour l'upload
  showUploadModal = false;
  selectedFile: File | null = null;
  isUploading = false;
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  // Ajoutez ces propriétés manquantes
  isDragOver = false;
  uploadProgress = 0;

  constructor(
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private documentService: DocumentServiceService
  ) {}

  ngOnInit(): void {
      if(this.profileId === null){
     this.userId = this.authService.getUserId();
    } else{
     this.userId = this.profileId;
    }
    //console.log('ID utilisateur récupéré:', this.userId);
    
    if (this.userId) {
      this.loadDocuments();
    } else {
      console.error('User is not authenticated');
      // Rediriger vers la page de connexion ou afficher un message
    }
  }

  loadDocuments(): void {
    if (this.userId) {
      this.subscription = this.authService.documentUpdate$.subscribe(isAuthenticated => {
    this.documentService.getDocumentsByUserAndFolder(this.userId!, this.typedocument).subscribe(
      response => {
        this.documents=response;
      },
      error => {
        console.error('Erreur lors du chargement des Types de sejour', error);
      }
    );})
    }
    }
  viewDocument(documentData: any): void {
    this.selectedDocument = documentData;
    if (documentData.presignedUrl) {
      // Sanitize the URL and open it
      this.sanitizedPdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(documentData.presignedUrl);
      this.showPdf = true;
    } else {
      console.error('No presigned URL available for this document');
    }
  }

  closePdf(): void {
    this.showPdf = false;
    this.selectedDocument = null;
  }

    confirmDelete(documentId: number, fileName: string): void {
    this.confirmDeletePopup(documentId,fileName)
  }
confirmDeletePopup(documentId: number, fileName: string): void {
  Swal.fire({
    text:`Êtes-vous sûr de vouloir supprimer "${fileName}" ?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
  }).then((result) => {
    if (result.isConfirmed) {
      this.deleteDocument(documentId);
      Swal.fire('Supprimé!', 'Le document a été supprimé.', 'success');
    }
  });
}
isDeleting = false;
  private showSuccessAlert(title: string, text: string): void {
    
    Swal.fire({
      title,
      text,
      icon: 'success',
      confirmButtonText: 'Parfait !',
      confirmButtonColor: '#6c63ff'
    });
  }
deleteDocument(documentId: number): void {
    this.isDeleting = true;
    this.documentService.deleteDocument(documentId).subscribe({
        next: () => {
            this.isDeleting = false;
          
            this.authService.notifyDocumentUpdate();
        },
        error: () => {
            this.isDeleting = false;
        }
    });
}


  // Nouvelles méthodes pour l'upload de fichiers
  openFileUpload(): void {
    this.showUploadModal = true;
    this.selectedFile = null;
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.selectedFile = null;
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
    } else {
      alert('Veuillez sélectionner un fichier PDF');
      this.selectedFile = null;
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        this.selectedFile = file;
      } else {
        alert('Veuillez sélectionner un fichier PDF');
      }
    }
  }

  uploadDocument(): void {
    if (!this.selectedFile || !this.userId) return;

    this.isUploading = true;
    this.uploadProgress = 0;
    
    // Simuler la progression de l'upload
    const interval = setInterval(() => {
      this.uploadProgress += 5;
      if (this.uploadProgress >= 100) {
        clearInterval(interval);
      }
    }, 100);
    
    // Extraire le nom du fichier sans l'extension
    const fileName = this.selectedFile.name.replace(/\.[^/.]+$/, "");
    
    // Appeler la méthode avec tous les arguments requis
    this.documentService.uploadDocument(
      this.selectedFile,
      fileName,
      'Diplome'
    ).subscribe({
      next: (response) => {
        clearInterval(interval);
        this.uploadProgress = 100;
        
        // Attendre un peu pour montrer 100% avant de fermer
        setTimeout(() => {
          this.isUploading = false;
          this.closeUploadModal();
          this.loadDocuments();
            this.showSuccessAlert('📜 Diplome ajouté', 'Vos diplomes ont bien été enregistrés.');
          // alert('Diplôme ajouté avec succès');
        }, 500);
      },
      error: (error) => {
        clearInterval(interval);
        this.isUploading = false;
        console.error('Erreur lors de l\'upload du document', error);
        alert('Erreur lors de l\'ajout du diplôme');
      }
    });
  }
}