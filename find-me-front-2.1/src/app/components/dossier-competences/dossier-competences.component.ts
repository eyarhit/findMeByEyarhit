import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DocumentServiceService } from '../../services/document-service.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

interface Document {
  idDocument: number;
  fileName: string;
  folderName: string;
  presignedUrl: string;
  selected?: boolean;
}

@Component({
  selector: 'app-dossier-competences',
  templateUrl: './dossier-competences.component.html',
  styleUrls: ['./dossier-competences.component.scss']
})
export class DossierCompetencesComponent implements OnInit {
  @Input() dossierIds: number[] = [];
  @Input() espace:string ='';
  @Input() idselectedCv: number | null = null;
  @Input() profileId: number | null = null;
  @Output() visible = new EventEmitter<number[]>();
  @Output() closeModal = new EventEmitter<void>();
  @Output() documentsSelected = new EventEmitter<number[]>();

  userId: number | null = null;
  certificates: Document[] = [];
  diplomes: Document[] = []; // Added diplomes array
  cvDocuments: Document[] = [];
  selectedDocumentIds: number[] = [];
  isLoading = false;

  constructor(
    private documentService: DocumentServiceService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userId = this.profileId || this.authService.getUserId();
    if(this.espace!='Offres publier' && this.espace!='Mission publier'){
      this.selectedDocumentIds = this.idselectedCv ? [this.idselectedCv] : [];
      if (this.userId && this.visible) {
        this.loadDocuments();
      }
    } else {
      this.loadDossierCompetences(this.dossierIds);
    }
  }

  ngOnChanges(): void {
    this.userId = this.profileId || this.authService.getUserId();
    if(this.espace!='Offres publier' && this.espace!='Mission publier'){
      if (this.visible && this.userId) {
        this.loadDocuments();
      }
    } else {
      if (this.userId && this.dossierIds?.length > 0) {
        this.loadDossierCompetences(this.dossierIds);
      }
    }
  }

  loadDocuments(): void {
    if (!this.userId) return;

    this.isLoading = true;
    let cvLoaded = false;
    let certsLoaded = false;
    let diplomesLoaded = false;

    const tryFinalize = () => {
      if (cvLoaded && certsLoaded && diplomesLoaded) {
        this.updateSelectedDocuments();
        this.isLoading = false;
      }
    };

    // Load certificates
    this.documentService.getDocumentsByUserAndFolder(this.userId, 'Certificat').subscribe({
      next: (response) => {
        this.certificates = Array.isArray(response)
          ? response.map((doc) => ({
              idDocument: doc.document,
              fileName: doc.fileName,
              folderName: 'Certificat',
              presignedUrl: doc.presignedUrl,
              selected: false
            }))
          : [];
        certsLoaded = true;
        tryFinalize();
      },
      error: (error) => {
        console.error('Error loading certificates:', error);
        this.certificates = [];
        certsLoaded = true;
        tryFinalize();
      }
    });

    // Load diplomes
    this.documentService.getDocumentsByUserAndFolder(this.userId, 'Diplome').subscribe({
      next: (response) => {
        this.diplomes = Array.isArray(response)
          ? response.map((doc) => ({
              idDocument: doc.document,
              fileName: doc.fileName,
              folderName: 'Diplome',
              presignedUrl: doc.presignedUrl,
              selected: false
            }))
          : [];
        diplomesLoaded = true;
        tryFinalize();
      },
      error: (error) => {
        console.error('Error loading diplomes:', error);
        this.diplomes = [];
        diplomesLoaded = true;
        tryFinalize();
      }
    });

    // Load CV
    if (!this.idselectedCv) {
      this.cvDocuments = [];
      cvLoaded = true;
      tryFinalize();
      return;
    }

    this.documentService.getDocument(this.idselectedCv).subscribe({
      next: (response) => {
        this.cvDocuments = Array.isArray(response)
          ? response.map((doc: any) => ({
              idDocument: doc.document.idDocument,
              fileName: doc.document.fileName,
              folderName: 'CvPDF',
              presignedUrl: doc.presignedUrl,
              selected: true
            }))
          : [{
              idDocument: response.document.idDocument,
              fileName: response.document.fileName,
              folderName: 'CvPDF',
              presignedUrl: response.presignedUrl,
              selected: true
            }];
        cvLoaded = true;
        tryFinalize();
      },
      error: (error) => {
        console.error('Error loading CV:', error);
        this.cvDocuments = [];
        cvLoaded = true;
        tryFinalize();
      }
    });
  }

loadDossierCompetences(dossierIds: number[]): void {
  console.log('[DEBUG] loadDossierCompetences called — userId:', this.userId, 'dossierIds:', dossierIds);
  if (!this.userId || !dossierIds || dossierIds.length === 0) {
    console.warn('[DEBUG] loadDossierCompetences — early return, userId or dossierIds missing');
    this.isLoading = false;
    return;
  }

  this.isLoading = true;
  
  this.documentService.getDocumentsByIds(dossierIds).subscribe({
    next: (documents: any[]) => {
      // Clear existing arrays
      this.cvDocuments = [];
      this.certificates = [];
      this.diplomes = []; // Clear diplomes array
      this.selectedDocumentIds = [];
      
      // Process each document with proper type checking
      documents.forEach(doc => {
        if (!doc?.idDocument || !doc?.fileName || !doc?.filePath) {
          console.warn('Invalid document format:', doc);
          return;
        }

        const isCv = doc.filePath.startsWith('CvFindMe') || doc.filePath.startsWith('CvPDF');
        const isDiplome = doc.filePath.startsWith('Diplome');
        
        let folderName = 'Certificat'; // default
        if (isCv) {
          folderName = 'CvPDF';
        } else if (isDiplome) {
          folderName = 'Diplome';
        }

        const document: Document = {
          idDocument: doc.idDocument,
          fileName: doc.fileName,
          folderName: folderName,
          presignedUrl: doc.presignedUrl || '',
          selected: isCv // CVs are selected by default
        };
        
        if (isCv) {
          this.cvDocuments.push(document);
          if (!this.selectedDocumentIds.includes(doc.idDocument)) {
            this.selectedDocumentIds.push(doc.idDocument);
          }
        } else if (isDiplome) {
          this.diplomes.push(document);
        } else {
          this.certificates.push(document);
        }
      });
      
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Error loading documents:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Une erreur est survenue lors du chargement des documents'
      });
      this.isLoading = false;
    }
  });
}

  toggleDocumentSelection(document: Document): void {
    // Allow toggling for certificates and diplomes
    if (document.folderName === 'Certificat' || document.folderName === 'Diplome') {
      document.selected = !document.selected;
      this.updateSelectedDocuments();
    }
  }

  updateSelectedDocuments(): void {
    // Include all CV documents
    const cvIds = this.cvDocuments.map(cv => cv.idDocument);
    
    // Include selected certificates
    const selectedCertIds = this.certificates
      .filter(cert => cert.selected)
      .map(cert => cert.idDocument);
    
    // Include selected diplomes
    const selectedDiplomeIds = this.diplomes
      .filter(diplome => diplome.selected)
      .map(diplome => diplome.idDocument);
    
    this.selectedDocumentIds = [...cvIds, ...selectedCertIds, ...selectedDiplomeIds];
  }

  selectAllCertificates(): void {
    const allSelected = this.certificates.every(cert => cert.selected);
    this.certificates.forEach(cert => cert.selected = !allSelected);
    this.updateSelectedDocuments();
  }

  // New method for diplomes
  selectAllDiplomes(): void {
    const allSelected = this.diplomes.every(diplome => diplome.selected);
    this.diplomes.forEach(diplome => diplome.selected = !allSelected);
    this.updateSelectedDocuments();
  }

  viewDocument(document: Document): void {
    if (document.presignedUrl) {
      window.open(document.presignedUrl, '_blank');
    }
  }

  onPostuler(): void {
    this.documentsSelected.emit(this.selectedDocumentIds);
  }

  onClose(): void {
    this.visible.emit();
  }

  get allCertificatesSelected(): boolean {
    return this.certificates.length > 0 && 
           this.certificates.every(cert => cert.selected);
  }

  // New getter for diplomes
  get allDiplomesSelected(): boolean {
    return this.diplomes.length > 0 && 
           this.diplomes.every(diplome => diplome.selected);
  }

  get hasSelectedDocuments(): boolean {
    return this.selectedDocumentIds.length > 0;
  }
}