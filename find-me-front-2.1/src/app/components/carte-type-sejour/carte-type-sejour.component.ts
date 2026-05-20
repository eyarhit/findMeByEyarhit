import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentServiceService } from '../../services/document-service.service';
import { Subscription, catchError, forkJoin, of } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-carte-type-sejour',
  templateUrl: './carte-type-sejour.component.html',
  styleUrl: './carte-type-sejour.component.scss'
})
export class CarteTypeSejourComponent implements OnInit, OnDestroy {
  @Input() espace:string=''
  @Input() typedocument:string ='';
  @Input() profileId : number | null = null;
  @Input() profilerole : string ='';
  @Output() SelectedDocument = new EventEmitter<any>() || null;
  @Output() choisircvBeehive = new EventEmitter<any>() || null;
  files: File[] = [];
  isExtrait = false;
  showPdf = false;
  sanitizedPdfSrc!: SafeResourceUrl;
  userId: number | null = null;
  documents: any[] = [];
  selectedDocument: any = null;
  role: string | null = null;
  email: string | null = null;
  private subscription?: Subscription;

  constructor(
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private documentService: DocumentServiceService
  ) {}
  selectedDocId: number | null = null;

  // Handle checkbox selection
  onSelectDocument(docId: number): void {
    if (this.selectedDocId === docId) {
      this.selectedDocId = null;
    } else {
      this.selectedDocId = docId;
    }
  }

  // Log the selected document
  confirmSelectedDocument(): void {
    if (this.selectedDocId) {
      this.SelectedDocument.emit(this.selectedDocId);
      this.choisircvBeehive.emit(false)
      // //console.log('Document sélectionné ID:', this.selectedDocId);
    } else {
      console.warn('Aucun document sélectionné');
    }
  }

  ngOnInit(): void {
    if(this.profileId === null){
      this.role = this.authService.getRole();
     this.userId = this.authService.getUserId();
    } else{
      this.role = this.profilerole;
     this.userId = this.profileId;
    }
    
    this.role = this.authService.getRole();
   
    if (this.userId) {
      this.loadDocuments();
    } else {
      console.error('User is not authenticated');
    }
  }
handleItemClick(docId: number, event: MouseEvent): void {
  // Skip if clicked on an interactive element (buttons, links, etc.)
  const target = event.target as HTMLElement;
  if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button, a')) {
    return;
  }

  if (this.typedocument === 'CvFindMe') {
    this.selectedDocId = this.selectedDocId === docId ? null : docId;
  }
}
  loadDocuments(): void {
    if (!this.userId) return;

    if(this.typedocument==''){
      if(this.role === 'FREELANCER'|| this.role === 'ESN_ADMIN'|| this.role === 'PORTAGE_SALARIAL'){
        this.typedocument="Extrait";
      } else if(this.role==="CANDIDAT"){ 
        this.typedocument="Type_Sejour";
      }
    }

    const load = () => {
      // During application flow, a "saved CV" can live under either folder.
      if (this.typedocument === 'CvFindMe') {
        forkJoin([
          this.documentService.getDocumentsByUserAndFolder(this.userId!, 'CvFindMe').pipe(catchError(() => of([]))),
          this.documentService.getDocumentsByUserAndFolder(this.userId!, 'CvPDF').pipe(catchError(() => of([])))
        ]).subscribe({
          next: ([cvFindMeDocs, cvPdfDocs]) => {
            const merged = [...(cvFindMeDocs || []), ...(cvPdfDocs || [])];
            const seen = new Set<number>();
            this.documents = merged.filter((doc: any) => {
              const id = Number(doc?.document);
              if (!Number.isFinite(id) || seen.has(id)) return false;
              seen.add(id);
              return true;
            });
          },
          error: (error) => {
            console.error('Erreur lors du chargement des CV sauvegardes', error);
            this.documents = [];
          }
        });
        return;
      }

      this.documentService.getDocumentsByUserAndFolder(this.userId!, this.typedocument!).subscribe({
        next: (response) => {
          this.documents = response;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des documents', error);
          this.documents = [];
        }
      });
    };

    load();
    this.subscription = this.authService.documentUpdate$.subscribe(() => load());
  }

  viewDocument(documentData: any): void {
    this.selectedDocument = documentData;
    //console.log(documentData.presignedUrl)
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
  
isDeleting = false;


// Inside your component method where you want to confirm deletion:
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

  closePopupCarteSejour(){
    this.isExtrait=false;
  }
UploadDocument(){
  this.isExtrait=true;
}

  handleFilesAdded(newFiles: File[]): void {
    // Append new files, avoid duplicates if needed
    this.files = [...this.files, ...newFiles];

  }
  
  handleFileRemoved(index: number): void {
    this.files.splice(index, 1);
    // Trigger change detection if needed
    this.files = [...this.files];
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
  
}
