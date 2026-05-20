import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ApiRoutingServiceUser } from '../../services/api-routing-user.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { catchError, forkJoin, map, of, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { DocumentServiceService } from '../../services/document-service.service';
import { CandidatureService } from '../../services/candidature';
import { NotificationService } from '../../services/notificationService';

interface User {
  id: number;
  name: string;
  email: string;
  numTelephone: string;
  imageProfile: string;
  role: string;
  status: string; // ou un type union spécifique si nécessaire
  candidature?: { 
    idCandidat: number; // Rendons cette propriété optionnelle
    idCandidature: number;
    datePostulation: Date;
    dossiercompetence: number[];
    statutCandidature: string;
    mission: {
      idMission: number;
      referenceCode: string;
      typeContrat?: string;
    };
  };
}

@Component({
  selector: 'app-list-utilisateur',
  templateUrl: './list-utilisateur.component.html',
  styleUrls: ['./list-utilisateur.component.scss'],
})
export class ListUtilisateurComponent implements OnInit, OnChanges {
  @Input() dossierId?: number[];
  @Input() missionId:string='';
  visible:boolean=false;
  @Input() espace: string = '';
  contrat:boolean=false;
  accountId: number | null = null;
  url: string = '';
  profileEmail: string = '';
  profile:boolean=false;
  invitedByFilter:any;
  userespace:boolean=false;
  userRole: string = '';
  isLoading = true; 
  ajouter_employer:boolean=false;
  users: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];
  subscription?: Subscription;
  searchTerm = '';
  statusFilter = '';
  id_societer: number | null = null;
  profileId: number | null = null;
  activeDropdown: number | null = null;
  role: string = '';
  accountRole: string = '';
  currentPage = 1;
  readonly itemsPerPage = 8;
 userOptions: any[] = []; 
  countByStatus: Record<string, number> = {
    PENDING: 0,
    ACTIVE: 0,
    INACTIVE: 0,
  };
  countByStatusCandidature: Record<string, number> = {
  ENCOURS: 0,
  ACCEPTER: 0,
  REFUSER: 0,
};

  constructor(
    private notificationService:NotificationService,
    private candidatureService:CandidatureService,
    private apiRoutingServiceUser: ApiRoutingServiceUser,
    private authServiceUser: AuthService,
    private route: ActivatedRoute,
    private documentService: DocumentServiceService ,
  ) {}

// Toggle l'édition du statut
onStatusChange(newStatus: string, user: any): void {
  if (user.candidature) {
    const normalized = this.normalizeCandidatureStatus(newStatus);
    user.candidature.statutCandidature = normalized;
    this.updateCandidatureStatus(user);
  }
}
// Mettre à jour le statut côté backend
updateCandidatureStatus(user: any): void {
  const normalizedStatus = this.normalizeCandidatureStatus(String(user.candidature.statutCandidature));
  this.candidatureService.updateCandidatureStatus(
    user.candidature.idCandidature, 
    normalizedStatus
  ).subscribe({
    next: () => {
      // Keep UI in sync with backend source of truth.
      if (this.missionId) {
        this.loadCandidatures(this.missionId);
      }
      this.updateByStatusCandidature()
      ////console.log('test',user.candidature)
      this.sendNotification(
        String(user.candidature.idCandidat),
        `Votre candidature «${user.candidature.mission.referenceCode}» est maintenant: ${this.getReadableStatusLabel(normalizedStatus)}`,
        user.candidature?.mission?.idMission,
        user.candidature?.mission?.typeContrat
      );
      Swal.fire('Succès', 'Statut mis à jour avec succès', 'success');
      user.isEditing = false;
    },
    error: (err) => {
      console.error('Erreur mise à jour statut', err);
      Swal.fire('Erreur', 'Échec de la mise à jour', 'error');
    }
  });
}

private normalizeCandidatureStatus(raw: string): string {
  const normalized = (raw || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-\s]+/g, '_');

  if (normalized === 'ENCOURS' || normalized === 'EN_COURS' || normalized === 'ENATTENTE' || normalized === 'EN_ATTENTE') {
    return 'ENCOURS';
  }
  if (normalized === 'ACCEPTER' || normalized === 'ACCEPTE' || normalized === 'ACCEPTEE') {
    return 'ACCEPTER';
  }
  if (normalized === 'REFUSER' || normalized === 'REFUSE' || normalized === 'REFUSEE') {
    return 'REFUSER';
  }
  return 'ENCOURS';
}

private getReadableStatusLabel(status: string): string {
  switch (status) {
    case 'ENCOURS':
      return 'En cours';
    case 'ACCEPTER':
      return 'Acceptee';
    case 'REFUSER':
      return 'Refusee';
    default:
      return 'En cours';
  }
}
  sendNotification(userId: string, message: string, missionId?: number, typeContrat?: string): void {
    if (!missionId) {
      this.notificationService.sendNotificationToUser(userId, message);
      return;
    }
    const offreTypes = ['CDI', 'CDD', 'ALTERNANCE'];
    const targetRoute = offreTypes.includes(String(typeContrat || '').toUpperCase())
      ? `/OffreDetails/${missionId}`
      : `/MissionDetails/${missionId}`;
    this.notificationService.sendNotificationToUserWithTarget(
      userId,
      message,
      targetRoute,
      missionId,
      'MISSION'
    );
  }
  ngOnInit():void{
    const missionIdFromRoute = this.route.snapshot.paramMap.get('missionId');
    if (!this.missionId && missionIdFromRoute) {
      this.missionId = missionIdFromRoute;
    }

    if(this.role==='ADMIN')
    {
       this.LoadUsers()
    } 
    if(this.missionId!=''){
    this.OnInitCandidature(this.missionId);
  }
    else{
          this.OnInit();
    }
  }

/// partie Admin
LoadUsers(){
console.log("Admin")
}
////

  OnInit(): void {

    this.userRole = this.route.snapshot.data['userRole'] || '';
    this.role=this.authServiceUser.getRole()!;
    //console.log('yoo espace',this.userRole)
    this.accountRole = this.authServiceUser.getRole()!;
    this.accountId=this.authServiceUser.getUserId()!;

    this.apiRoutingServiceUser.getUserByEmail(`${this.authServiceUser.getEmail()}`,this.authServiceUser.getToken()!).subscribe({
      next: (response) => {
        this.id_societer =
          response.id_societer != null
            ? response.id_societer
            : (response.userId != null ? response.userId : this.accountId);
        if(this.accountRole!="ESN_ADMIN"){
        this.fetchUsers();
        forkJoin([
         this.apiRoutingServiceUser.requestGetApi(`/${this.id_societer}`),
         this.apiRoutingServiceUser.getUsersByRole('ESN_COMMERCIAL',this.id_societer!)
         ]).subscribe(([admins, commerciaux]) => {
  const adminsList = [admins]; // converts object values to array
  this.userOptions = [...adminsList, ...commerciaux];
});
     }
      },
      error: (error) => {
        console.error('❌ Erreur lors de la récupération des infos personnelles', error);
      }
    });
    
    
 if(this.accountRole==="ESN_ADMIN"){
  this.fetchUsers();
forkJoin([
  this.apiRoutingServiceUser.requestGetApi(`/${this.accountId}`),
  this.apiRoutingServiceUser.getUsersByRole('ESN_COMMERCIAL', this.accountId)
]).subscribe(([admins, commerciaux]) => {
  const adminsList = [admins]; // converts object values to array
  this.userOptions = [...adminsList, ...commerciaux];
  //console.log('yooy',this.userOptions )
});
 }
    
  }
OnInitCandidature(missionId: string):void{ this.loadCandidatures(missionId);}
 handDossierCompethenceVisibility(visible: any) {
this.visible=visible}

loadCandidatures(missionId: string): void {
  this.isLoading = true;
  this.candidatureService.getCandidaturesByMissionId(Number(missionId)).subscribe({
    next: (candidatures: any[]) => {
      console.log('[DEBUG] raw candidatures:', JSON.stringify(candidatures));
      if (candidatures?.length) {
        const requests = candidatures.map(candidature => {
          // ////console.log("candidature",candidature)
          return forkJoin([
            this.apiRoutingServiceUser.getUsersByUserId(candidature.candidatId),
            this.documentService.getDocumentsByUserAndFolder(candidature.candidatId, "ProfileImage")
          ]).pipe(
            map(([user, profileImages]) => {
              const profileImageUrl = profileImages?.[0]?.presignedUrl;
              const dp = candidature.datePostulation;
              let datePostulation: Date | null = null;
              if (dp != null) {
                if (dp instanceof Date) {
                  datePostulation = dp;
                } else if (typeof dp === 'string' || typeof dp === 'number') {
                  datePostulation = new Date(dp);
                } else if (Array.isArray(dp) && dp.length >= 3) {
                  datePostulation = new Date(
                    dp[0],
                    (dp[1] ?? 1) - 1,
                    dp[2] ?? 1,
                    dp[3] ?? 0,
                    dp[4] ?? 0,
                    dp[5] ?? 0,
                    dp[6] ?? 0
                  );
                }
              }
              const dossierRaw = candidature.dossiercompetence ?? candidature.dossierCompetence;
              let dossiercompetence: number[] = [];
              if (Array.isArray(dossierRaw)) {
                dossiercompetence = dossierRaw.map((x: any) => Number(x)).filter((n: number) => !isNaN(n));
              } else if (typeof dossierRaw === 'string' && dossierRaw.trim().startsWith('[')) {
                try {
                  dossiercompetence = JSON.parse(dossierRaw);
                } catch {
                  dossiercompetence = [];
                }
              }
              return {
                id: user.userId,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                numTelephone: user.phone,
                imageProfile: profileImageUrl,
                role: this.userRole,
                status: user.status as unknown as string,
                candidature: {
                  idCandidat:candidature.candidatId,
                  idCandidature: candidature.idCandidature,
                  datePostulation,
                  dossiercompetence,
                  statutCandidature: candidature.statutCandidature,
                  mission: {
                    idMission: candidature.mission.idMission,
                    referenceCode: candidature.mission.reference_code,
                    typeContrat: candidature.mission?.descrip_mission?.typeContrat
                  }
                }
              } as User;
            }),
            catchError(err => {
              console.error('Erreur lors de la récupération des données utilisateur', err);
              return of(null);
            })
          );
        });
        
        forkJoin(requests).subscribe((results: (User | null)[]) => {
          this.users = results.filter((user): user is User => user !== null);
          this.applyFilter();
          
        this.updateByStatusCandidature()
        this.isLoading = false;
        });
      } else {
        this.isLoading = false;
      }
    },
    error: (err) => {
      console.error('Erreur candidatures', err);
      this.isLoading = false;
    }
  });
}

private getUserDetails(userId: number): void {
  this.apiRoutingServiceUser.getUsersByUserId(userId).subscribe({
    next: (userData) => {
      ////console.log("Détails du candidat:", userData);
      // Traitez les données utilisateur ici
    },
    error: (err) => {
      console.error('Erreur lors de la récupération des détails du candidat', err);
    }
  });
}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userRole'] && !changes['userRole'].isFirstChange()) {
      this.fetchUsers();
    }
  }
openAjouterPopUp(){
  this.ajouter_employer=true
}
closeAjouterPopUp(){
  this.ajouter_employer=false
}   
fetchUsers(): void {
  this.isLoading = true;

  this.subscription = this.authServiceUser.dataUpdate$.subscribe(() => {
    const idResponsable = this.invitedByFilter || this.authServiceUser.getUserId();
    const isDualRole = this.userRole === 'ESN_ADMIN' || this.userRole === 'ESN_COMMERCIAL';

    let mainUrl = '';
    let secondUrl = '';

    if (this.accountRole === 'ADMIN') {
      mainUrl = `/role/${this.userRole}`;
    } else if (this.accountRole === 'ESN_ADMIN') {
      mainUrl = this.invitedByFilter
        ? `/by-role-responsable?role=${this.userRole}&idResponsable=${idResponsable}`
        : `/by-societe?role=${this.userRole}&idSociete=${this.accountId}`;

      if (isDualRole && !this.invitedByFilter) {
        secondUrl = `/${this.accountId}`;
      }
    } else {
      mainUrl = this.invitedByFilter
        ? `/by-role-responsable?role=${this.userRole}&idResponsable=${idResponsable}`
        : `/by-societe?role=${this.userRole}&idSociete=${this.id_societer}`;

      if (isDualRole && !this.invitedByFilter) {
        secondUrl = `/${this.id_societer}`;
      }
    }

    // Handle single or dual request
    const requests = [this.apiRoutingServiceUser.requestGetApi(mainUrl)];
    if (secondUrl) {
      requests.push(this.apiRoutingServiceUser.requestGetApi(secondUrl));
    }

    forkJoin(requests).subscribe({
  next: (responses: any[]) => {
    const first = Array.isArray(responses[0]) ? responses[0] : [];
    const second = responses.length > 1 && Array.isArray([responses[1]]) ? [responses[1]] : [];
    const combined = [...first, ...second];
    ////console.log(combined)
  this.users = combined.filter(user => user.userId !== this.accountId).map(user => {
  const userObj = {
    id: user.userId,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    numTelephone: user.phone,
    imageProfile: user.presignedUrl,
    role: this.userRole,
    status: user.status,
  };
  

    this.documentService.getDocumentsByUserAndFolder(user.userId, "ProfileImage").subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          userObj.imageProfile = response[0].presignedUrl;
        }
      },
      error: (err) => {
        console.error('Error fetching profile image:', err);
      }
    });
    return userObj;
});
    this.updateStatusCounts();
    this.applyFilter();
    this.isLoading = false;
  },
  error: error => {
    console.error('Erreur lors de la récupération des utilisateurs :', error);
    this.isLoading = false;
  },
});


  });// Map combined data to users array

}
updateByStatusCandidature(): void {
  // Reset all counts to 0
  this.countByStatusCandidature = { ENCOURS: 0, ACCEPTER: 0, REFUSER: 0 };
  
  // Count each status
  for (const user of this.users) {
    const rawStatus = user.candidature?.statutCandidature;
    if (!rawStatus) {
      continue;
    }
    const normalized = this.normalizeCandidatureStatus(rawStatus);
    if (this.countByStatusCandidature.hasOwnProperty(normalized)) {
      this.countByStatusCandidature[normalized]++;
    }
  }
}

  updateStatusCounts(): void {
    this.countByStatus = { PENDING: 0, ACTIVE: 0, INACTIVE: 0 };
    for (const user of this.users) {
      if (user.status && this.countByStatus.hasOwnProperty(user.status)) {
        this.countByStatus[user.status]++;
      }
    }
  }
supprimeUser(userId: number): void {
  Swal.fire({
    title: 'Êtes-vous sûr ?',
    text: "Vous ne pourrez pas revenir en arrière !",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Oui, supprimer !',
    cancelButtonText: 'Annuler'
  }).then((result) => {
    if (result.isConfirmed) {
      this.deleteUser(userId,this.authServiceUser.getUserId()!);
    }
  });
}

deleteUser(deleteduserId: number,userId: number): void {
  // Show loading indicator
  Swal.fire({
    title: 'Suppression en cours',
    html: 'Veuillez patienter...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  this.apiRoutingServiceUser.deleteUser(deleteduserId,userId).subscribe({
    next: () => {
      Swal.fire({
        title: 'Supprimé !',
        text: "L'utilisateur a été supprimé avec succès.",
        icon: 'success',
        confirmButtonText: 'OK'
      });
      this.authServiceUser.notifyDataUpdate();
    },
    error: (err) => {
      Swal.fire({
        title: 'Erreur !',
        text: "Échec de la suppression : " + (err.error?.message || err.message),
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  });
}
  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredUsers = this.users.filter(user =>
      (user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)) &&
      (this.statusFilter === '' || user.status === this.statusFilter)
    );
    this.currentPage = 1;
    this.updatePaginatedUsers();
  }

  updatePaginatedUsers(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedUsers = this.filteredUsers.slice(start, start + this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage = page;
      this.updatePaginatedUsers();
    }
  }

  totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.itemsPerPage);
  }

  toggleDropdown(index: number): void {
    this.activeDropdown = this.activeDropdown === index ? null : index;
  }

  viewProfile(userId: number,email: string): void {
    // ////console.log('User ID:', userId);
    this.profile=true;
    this.profileId=userId;
    this.profileEmail=email;
    // ////console.log('User ID:', this.profile);
  }
// Change the property to handle array
selectedDossierIds: number[] = [];
selectedDossierCandidatId: number | null = null;

// Update the method to handle array input
viewDossierCompethence(dossierIds: number[] | undefined, candidatId: number) {
  this.selectedDossierIds = dossierIds || [];
  this.selectedDossierCandidatId = candidatId;
  this.visible = true;
}
    viewContrat(userId: number,email: string,espace:string): void {
    // ////console.log('User ID:', userId);
    this.contrat=true;
    this.profileId=userId;
    this.profileEmail=email;
    this.espace=espace;
    // ////console.log('User ID:', this.profile);
  }

  updateUserStatus(userId: number, newStatus: string): void {
    this.apiRoutingServiceUser.requestPutApi(`/${userId}/status`, newStatus).subscribe({
      next: () => {
        const user = this.users.find(u => u.id === userId);
        if (user) {
          user.status = newStatus;
        }
        this.activeDropdown = null;
        this.updateStatusCounts();
        this.applyFilter();
        ////console.log('User status updated successfully');
      },
      error: error => {
        console.error('Error updating user status:', error);
      },
    });
  }
  
  consulterEspace(){
     this.userespace=true
  }
selectedUser: any = null; // store the full user object here
userSearchTerm: string = '';
userDropdownOpen: boolean = false;

filteredUserOptions: any[] = []; // filtered list shown in dropdown

toggleUserDropdown() {
  this.userDropdownOpen = !this.userDropdownOpen;
  if (this.userDropdownOpen) {
    this.filteredUserOptions = [...this.userOptions]; // reset filter on open
  }
}

filterUserOptions() {
  const term = this.userSearchTerm.toLowerCase();
  this.filteredUserOptions = this.userOptions.filter(user =>
    user.firstName.toLowerCase().includes(term) || user.lastName.toLowerCase().includes(term)
  );
}

selectUser(user: any | null) {
  this.selectedUser = user; // will be null when "All" is selected
  this.userDropdownOpen = false;
  this.invitedByFilter = user?.userId || null; // clear filter if user is null
  this.fetchUsers();
}
}
