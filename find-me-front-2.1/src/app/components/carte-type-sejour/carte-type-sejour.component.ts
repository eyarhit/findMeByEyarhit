import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
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
export class CarteTypeSejourComponent implements OnInit, OnChanges, OnDestroy {
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
  private loadRequestId = 0;

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
    this.resolveContext();
    if (this.userId) {
      this.loadDocuments();
    } else {
      console.error('User is not authenticated');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profileId'] || changes['profilerole'] || changes['typedocument']) {
      this.resolveContext();
      if (this.userId) {
        this.loadDocuments();
      }
    }
  }

  private resolveContext(): void {
    if (this.profileId == null) {
      this.userId = this.authService.getUserId();
      this.role = this.authService.getRole();
    } else {
      this.userId = this.profileId;
      this.role = this.profilerole || this.authService.getRole();
    }
    this.email = this.authService.getEmail();
  }

  private normalizeDocumentsResponse(response: unknown): any[] {
    if (!Array.isArray(response)) {
      return [];
    }
    return response.filter((doc) => doc && doc.document != null);
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
    if (!this.userId) {
      this.documents = [];
      return;
    }

    const folder = this.resolveDocumentFolder();
    if (!folder) {
      this.documents = [];
      return;
    }

    const requestId = ++this.loadRequestId;
    this.documents = [];

    const applyDocuments = (response: unknown) => {
      if (requestId !== this.loadRequestId) {
        return;
      }
      this.documents = this.normalizeDocumentsResponse(response);
    };

    const load = () => {
      if (folder === 'CvFindMe') {
        forkJoin([
          this.documentService.getDocumentsByUserAndFolder(this.userId!, 'CvFindMe').pipe(catchError(() => of([]))),
          this.documentService.getDocumentsByUserAndFolder(this.userId!, 'CvPDF').pipe(catchError(() => of([])))
        ]).subscribe({
          next: ([cvFindMeDocs, cvPdfDocs]) => {
            const merged = [
              ...this.normalizeDocumentsResponse(cvFindMeDocs),
              ...this.normalizeDocumentsResponse(cvPdfDocs),
            ];
            const seen = new Set<number>();
            applyDocuments(
              merged.filter((doc: any) => {
                const id = Number(doc?.document);
                if (!Number.isFinite(id) || seen.has(id)) {
                  return false;
                }
                seen.add(id);
                return true;
              })
            );
          },
          error: (error) => {
            console.error('Erreur lors du chargement des CV sauvegardes', error);
            applyDocuments([]);
          }
        });
        return;
      }

      this.documentService.getDocumentsByUserAndFolder(this.userId!, folder).subscribe({
        next: (response) => applyDocuments(response),
        error: (error) => {
          console.error('Erreur lors du chargement des documents', error);
          applyDocuments([]);
        }
      });
    };

    load();
    this.subscription?.unsubscribe();
    this.subscription = this.authService.documentUpdate$.subscribe(() => load());
  }

  private resolveDocumentFolder(): string {
    if (this.typedocument) {
      return this.typedocument;
    }
    if (this.role === 'FREELANCER' || this.role === 'PORTAGE_SALARIAL') {
      return 'Extrait';
    }
    if (this.role === 'CANDIDAT') {
      return 'Type_Sejour';
    }
    return '';
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
