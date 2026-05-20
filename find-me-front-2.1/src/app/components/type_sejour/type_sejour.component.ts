import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DocumentServiceService } from '../../services/document-service.service';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-type_sejour',
  templateUrl: './type_sejour.component.html',
  styleUrls: ['./type_sejour.component.scss']
})
export class TypeSejourComponent {
  @Input() type!: string;
  @Input() text: string | undefined;
  @Input() externalFiles: File[] = [];
  @Input() submitetype!: string;
  @Input() email!: string;
  @Output() filesAdded = new EventEmitter<File[]>();
  @Output() fileRemoved = new EventEmitter<number>();
  @Output() uploadClicked = new EventEmitter<void>();
fileName: string = '';
  popupMessage: string = '';
  popupType: 'success' | 'error' | '' = '';
  constructor(
    private documentService: DocumentServiceService,
    private authService: AuthService,
    
  ) {}
  ngOnInit(): void {
    if (this.submitetype === "submit") {
      this.externalFiles = [];
      //console.log(this.externalFiles)
    }
  }
  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    const fileArray: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (this.isValidFileType(file)) {
        fileArray.push(file);
      } else {
        this.showPopup("Veuillez sélectionner uniquement des fichiers PDF.", 'error');
        event.target.value = '';
        return;
      }
    }

    this.filesAdded.emit(fileArray);
    event.target.value = '';
  }

  isValidFileType(file: File): boolean {
    return file.type === 'application/pdf';
  }

  removeFile(index: number): void {
    this.fileRemoved.emit(index);
  }

  onUpload(): void {
    if (!this.externalFiles || this.externalFiles.length === 0) {
      this.showPopup("Veuillez sélectionner au moins un fichier avant d'importer.", 'error');
      return;
    }
     

    if(this.submitetype==="submit"){
              Swal.fire({
                text: 'Veuillez patienter pendant le téléchargement de vos documents.',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => Swal.showLoading()
              });
        
         this.externalFiles.forEach(file => {
        const fileName = this.fileName ? this.fileName : file.name;  // Use the provided file name or the original one
        this.documentService.uploadDocument(file, fileName,this.type,this.email).subscribe(
          response => {
            this.showSuccessAlert('📜 Extrait ajouté', 'Vos extrait ont bien été enregistrés.');
            this.authService.notifyDocumentUpdate();
          },
          error => {
            console.error('Error during document upload:', error);
          }
        );
      });
       this.externalFiles=[];
    }
    else{   
    this.uploadClicked.emit();
    //console.log(this.submitetype)
    this.showPopup("Documents importés avec succès !", 'success');}
    
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
  
  private showPopup(message: string, type: 'success' | 'error') {
    this.popupMessage = message;
    this.popupType = type;

    setTimeout(() => {
      this.popupMessage = '';
      this.popupType = '';
    }, 2000);
  }
}
