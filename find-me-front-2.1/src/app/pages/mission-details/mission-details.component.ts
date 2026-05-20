import { Component, ElementRef, Input, output, ViewChild } from '@angular/core';
import { MissionService } from '../../services/mission';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { jwtDecode } from 'jwt-decode';
import { DocumentServiceService } from '../../services/document-service.service';
import { CvService } from '../../services/cv.service';
import Swal from 'sweetalert2';
import { CandidatureService } from '../../services/candidature';
import { Console } from 'console';
import { ApiRoutingServiceUser } from '../../services/api-routing-user.service';
import { HttpParams } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { NotificationService } from '../../services/notificationService';

@Component({
  selector: 'app-mission-details',
  templateUrl: './mission-details.component.html',
  styleUrls: ['./mission-details.component.scss']
})
export class MissionDetailsComponent {
  selectedDocument: number | null = null;
  visible:boolean=false;
  @Input() visiteur=false;
  @Input() espace = this.route.snapshot.data['espace'] || '';
  @Input() mission_id =this.activatedRoute.snapshot.paramMap.get('jobId')|| null ;
  choisircvBeehive:boolean=false
  isEditing: boolean = false;
  IsDossierCompetence: boolean = false;
  IsExtrait: boolean = false;
  showPostulerCard: boolean = false;
  uploadedFile: File | null = null;
  isDragging = false;
  jobs: any[] = []; // Type the jobs list if possible
  userId: number | null = null;
  storedtargetmarket: string | null = null;
  currency:string |null=null;
  type_contrat: string = '';
  role: string | null = null;
  email: string | null = null;
  fileName: string | null = null;
type_document: string | null = null;
idDocument: string | null = null;
typeCandidature: string = 'annonce' ;
cvOption: 'consulter' | 'upload' = 'consulter';
errorMessage: string = '';
      enablepostuler: boolean = true;
@ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private route: ActivatedRoute,
    private candidatureService: CandidatureService,
    private missionService: MissionService,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
      private documentService: DocumentServiceService,
      private apiRoutingServiceUser: ApiRoutingServiceUser,
      private notificationService: NotificationService,
    private cvService: CvService) {}

  ngOnInit(): void {
    // console.log('espaece',this.espace)
    // Extract the mission ID from the route parameter
  // Get target market from session storage
  const profile = JSON.parse(sessionStorage.getItem('profile') || '{}');
  this.storedtargetmarket = profile.targetmarket || '';

if(this.storedtargetmarket === 'Tunisien'){this.currency=' TND'}else  {this.currency=' €'}

    this.userId  = this.authService.getUserId();
   this.VérifierCandidatureExist()

    this.role  = this.authService.getRole();
    this.email = this.authService.getEmail();
      if(this.espace==="Postuler Mission"){
    this.type_contrat='de la mission' }
    else{ this.type_contrat="d'offre d'emplois" }
    if(this.role==="FREELANCER" || this.role==='PORTAGE_SALARIAL'  ){
      // this.typeCandidature="MISSION"
      this.type_document="Extrait";
      this.VerifierExtrait()
    }
    if(this.role==='CANDIDAT'){
      // this.typeCandidature="OFFRE"
       const params = new HttpParams().set('email', this.email!);
  this.apiRoutingServiceUser.requestGetApi('/find-user-by-email', params).subscribe({
  next: (response) => {
    if(response.country==="Tunisie" && response.targetmarket==="Francais")
   {
    this.type_document="Type_Sejour";
    this.VerifierExtrait()
  }else
  {
    this.IsExtrait=true;
  }
  },
  error: (error) => {
    console.error(error);
  }
});

    }

    if (this.mission_id) {
      this.LoadMissionData()

    }
    if(this.espace===''){
   this.VerifierDossierCompetence();
    }
  }
    handleEditStatus(isEditing: boolean) {
    this.isEditing=isEditing;
    this.LoadMissionData()
  }

  LoadMissionData() {
    this.missionService.getMissionById(Number(this.mission_id)).subscribe({
      next: (response: any) => {
        const societeId = response?.id_societer ?? response?.user_id ?? response?.idSociete;
        const fallbackLogo =
          response?.logo && (String(response.logo).startsWith('http') || String(response.logo).startsWith('data:'))
            ? response.logo
            : 'assets/images/default-company.png';

        const buildJob = (logoUrl: string) => ({
          id: response.idMission,
          ownerId: societeId,
          title: response.descrip_mission?.mission_name,
          company: response.descrip_mission?.poste,
          location: `${response.ville?.pays?.nom ?? ''} ${response.ville?.nomdeville ?? ''}`.trim(),
          salary: response.descrip_mission?.salaire,
          ref: response.reference_code,
          type: response.descrip_mission?.typeContrat,
          experience: (response.profilDemande?.annees_experiences ?? '') + ' ans',
          description: response.descrip_mission?.description,
          avantages: response.descrip_mission?.avantages,
          competences: response.descrip_mission?.competencesRequises,
          date_debut: response.descrip_mission?.date_debut,
          date_fin: response.descrip_mission?.date_fin,
          langue: response.descrip_mission?.langue,
          isRemote: response.descrip_mission?.isRemote,
          statut: response.descrip_mission?.statut,
          nbre_recruteurs: response.descrip_mission?.nbre_recruteurs,
          exigences: response.profilDemande?.exigences,
          statusMission: response.statusMission,
          createdAt: response.createdAt,
          logo: logoUrl,
          archived: response.archived,
        });

        if (societeId == null) {
          this.jobs = [buildJob(fallbackLogo)];
          return;
        }

        this.documentService
          .getDocumentsByUserAndFolder(societeId, 'ProfileImage')
          .pipe(catchError(() => of([])))
          .subscribe((document: any[]) => {
            const logo = document?.[0]?.presignedUrl || fallbackLogo;
            this.jobs = [buildJob(logo)];
          });
      },
      error: (error: any) => {
        console.error('❌ Erreur lors de récupération des missions', error);
      },
    });
  }
  VérifierCandidatureExist(){this.candidatureService.getCandidatureByCandidateAndMission(this.userId!, Number(this.mission_id)).subscribe({
  next: (response) => {
    if (response && response.length > 0) {

      this.enablepostuler = false;
    }
  },
  error: (error) => {
    console.error('Error fetching candidature:', error);
  }
});}
 triggerFileUpload() {
    this.fileInput.nativeElement.click();
  }
  validateAndSetFile(file: File) {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Seuls les fichiers PDF sont acceptés.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) { // 20MB max
      alert('La taille du fichier dépasse la limite de 20 Mo.');
      return;
    }

    this.uploadedFile = file;
  }
  AciverCard(){
    this.showPostulerCard = true;
  }
  PostulerCard(){

    if(!this.enablepostuler){
     this.showSuccessAlert('', `Vous avez déjà postuler a cette ${this.typeCandidature}`);
  }else{
    this.showPostulerCard = true
  }
  }


  handlechoisircvBeehive(choisircvBeehive: any) {

this.choisircvBeehive=choisircvBeehive
this.visible=true}

documentsSelected(selectedDocumentIds: any){
  this.selectedDocumentIds=selectedDocumentIds;
  let documentIds: number[] = [];
  if (this.selectedDocumentIds && this.selectedDocumentIds.length > 0) {
    documentIds = this.selectedDocumentIds;
  } else if (this.selectedDocument) {
    documentIds = [this.selectedDocument];
  } else {
    console.error("No document selected");
    Swal.fire({
      title: 'Erreur',
      text: 'Aucun document sélectionné.',
      icon: 'error',
      confirmButtonText: 'OK'
    });
    return;
  }
  console.log({ userId: this.userId, missionId: this.mission_id, documentIds });
  this.candidatureService.createCandidature(this.userId!, Number(this.mission_id)!, documentIds).subscribe({
    next: (res) => {
      this.notifyMissionOwnerOnApplication();
      if(this.espace==="Postuler Mission"){
      this.showSuccessAlert('', 'Votre postulation a été enregistrée avec succès.');
    }
      else if(this.espace==="Postuler Offre"){
      this.showSuccessAlert('', 'Votre postulation a été enregistrée avec succès.');
    }
    this.enablepostuler = false;
    },
    error: (err) => {
      console.error('Error creating candidature', err);
    }
  });
}

private notifyMissionOwnerOnApplication(): void {
  const mission = this.jobs?.[0];
  if (!mission || !this.userId) {
    return;
  }

  const ownerId = mission.ownerId;
  if (!ownerId || Number(ownerId) === Number(this.userId)) {
    return;
  }

  const offreTypes = ['CDI', 'CDD', 'ALTERNANCE'];
  const targetRoute = offreTypes.includes(String(mission.type || '').toUpperCase())
    ? `/Offres/candidatures/${mission.id}`
    : `/Missions/candidatures/${mission.id}`;
  const reference = mission.ref ? ` (${mission.ref})` : '';
  const message = `Nouvelle postulation reçue${reference}.`;

  this.notificationService.sendNotificationToUserWithTarget(
    String(ownerId),
    message,
    targetRoute,
    mission.id,
    'MISSION'
  );
}
  handDossierCompethenceVisibility(visible: any) {
this.visible=visible}
handleSelectedDocument(document: any) {
  if (document == null) {
    this.selectedDocument = null;
    return;
  }
  this.selectedDocument =
    typeof document === 'number'
      ? document
      : document?.idDocument ?? document?.document ?? null;
}
showDossierCompetences: boolean = false;
selectedDocumentIds: number[] = [];
choisirCvBeehive(){
  this.choisircvBeehive=true; }

onCloseDossierCompetences(): void {
  this.choisircvBeehive=false;
  this.selectedDocumentIds = [];
}

onDocumentsSelected(documentIds: number[]): void {
  this.selectedDocumentIds = documentIds;
  //console.log('IDs des documents sélectionnés pour la postulation:', this.selectedDocumentIds);
  this.showDossierCompetences = false;

  this.postulerAvecDocuments();
}

postulerAvecDocuments(): void {
  const missionId = Number(this.mission_id);
  if (isNaN(missionId)) {
    console.error('Invalid mission ID');
    return;
  }

//console.log(this.selectedDocumentIds)

}

Postuler() {
  this.errorMessage = '';

  if (!this.IsExtrait && (this.role === "FREELANCER" || (this.role != "ESN_ADMIN" && this.role != "ESN_COMMERCIAL" && this.role != "PORTAGE_SALARIAL"))) {
    this.errorMessage = "Déposez votre extrait s'il vous plaît.";
    return;
  }

  if (!this.IsExtrait && (this.role === "CANDIDAT" || (this.role != "ESN_ADMIN" && this.role != "ESN_COMMERCIAL"&& this.role != "PORTAGE_SALARIAL"))) {
    this.errorMessage = "Déposez votre type de séjour s'il vous plaît.";
    return;
  }

  const missionId = Number(this.mission_id);
  if (isNaN(missionId)) {
    console.error('Invalid mission ID');
    return;
  }

  if (this.cvOption === 'upload') {
    // Votre logique d'upload existante...
    if (!this.uploadedFile) {
      this.errorMessage = "Déposez votre cv s'il vous plaît.";
      return;
    }

    const fileName = this.fileName || this.uploadedFile.name;
Swal.fire({
  text: 'Veuillez patienter pendant le téléchargement de vos documents.',
  allowOutsideClick: false,
  allowEscapeKey: false,
  didOpen: () => Swal.showLoading()
});

this.documentService.uploadDocument(this.uploadedFile, fileName, "CvPDF", this.email!).subscribe({
  next: (response) => {
    this.idDocument = response.document.idDocument;
    this.selectedDocument = Number(this.idDocument);
    this.visible = true;
    Swal.close(); // Ferme la SweetAlert
  },
  error: (err) => {
    console.error('Erreur lors du dépôt du document:', err);
    Swal.close();
  }
});

  } else if (this.cvOption === 'consulter' && this.selectedDocumentIds.length===0) {
    this.errorMessage = "Veuillez sélectionner un CV FIND ME.";
  return
  }

}

    private showSuccessAlert(title: string, text: string): void {

Swal.fire({
  title,
  text,
  icon: 'success',
  confirmButtonText: 'Parfait !',
  confirmButtonColor: '#6c63ff'
}).then((result) => {
  if (result.isConfirmed) {
    this.showPostulerCard = false;
    this.visible=false
    this.choisircvBeehive=false;
  }
});

      this.uploadedFile=null;
      this.cvOption ="consulter";


    }
  DesactiverCard(){
    this.showPostulerCard = false;
  }
  VerifierDossierCompetence(){
        this.cvService.getCvByUserId(this.userId!).subscribe(
      (cv) => {
        if (cv) {
           if((cv.educations.length !== 0 || cv.experiences.length !== 0||cv.langues.length !== 0)&& cv.titreDeProfil!=null){
            this.IsDossierCompetence= true
          }else{
            this.IsDossierCompetence= false
          }
        }else{
           this.IsDossierCompetence= false
          }

      },
      (error) => console.error('❌ Erreur lors du chargement du CV:', error)
    );
  }
  VerifierExtrait() {
       this.documentService.getDocumentsByUserAndFolder(this.userId!, this.type_document!).subscribe(
      response => {
        if (response.length !== 0) {
          this.IsExtrait=true
        }
          else { this.IsExtrait=false}

      },
      error => {
        console.error('Erreur lors du chargement des Types de sejour', error);
      }
    );
  }
  onDragOver(event: DragEvent) {
    this.errorMessage = ""
  event.preventDefault();
  this.isDragging = true;
}

onDragLeave(event: DragEvent) {
  this.errorMessage = ""
  event.preventDefault();
  this.isDragging = false;
}

onDrop(event: DragEvent) {
  this.errorMessage = ""
  event.preventDefault();
  this.isDragging = false;
  if (event.dataTransfer && event.dataTransfer.files.length) {
    this.uploadedFile = event.dataTransfer.files[0];
  }
}
onFileSelected(event: Event) {

  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    this.validateAndSetFile(file);
  }
}
removeFile() {
  this.uploadedFile = null;
  this.fileInput.nativeElement.value = ''; // Reset input
}


}
