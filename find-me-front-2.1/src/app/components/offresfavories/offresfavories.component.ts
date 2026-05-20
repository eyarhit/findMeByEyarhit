import { Component, Input, OnInit } from '@angular/core';
import { FavoriService } from '../../services/favori.service';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentServiceService } from '../../services/document-service.service';
import { catchError, forkJoin, map, of } from 'rxjs';

interface FavoriteMission {
  id: number;
  title: string;
  company: string;
  ville: string;
  pays: string;
  salary: string;
  ref: string;
  type: string;
  experience: string;
  logo: string;
}

interface Job {
  id: number;
  title: string;
  company: string;
  ville: string;
  pays: string;
  salary: string;
  ref: string;
  type: string;
  experience: string;
  description: string;
  logo: string;
  avantages: string;
  competences: string[];
  date_debut: string;
  date_fin: string;
  langue: string;
  statut: string;
  isRemote: boolean; 
  nbre_recruteurs: number;
  exigences: string;
}

@Component({
  selector: 'app-offresfavories',
  templateUrl: './offresfavories.component.html',
  styleUrls: ['./offresfavories.component.scss']
})
export class OffresfavoriesComponent implements OnInit {
  @Input() espace = this.route.snapshot.data['espace'] || '';
  @Input() job!: Job;
  @Input() isEmpty = false;
  
  favorites: FavoriteMission[] = [];
  userId!: number;
  userType: string = '';
  showNotification = false;
  removedJobRef: string = '';
  countFavoris: number = 0;
  isLoading = false;
  isRemoving = false; // For individual remove operations

  constructor(
    private route: ActivatedRoute,
    private documentService: DocumentServiceService,
    private favoriService: FavoriService,
    private authService: AuthService,
    private router: Router
  ) {}

  viewMission(jobId: number): void {
    if (this.espace === "Mission") {
      this.router.navigate(['/MissionDetails', jobId]);
    } else if (this.espace === "Offre") {
      this.router.navigate(['/OffreDetails', jobId]);
    }
  }

  ngOnInit(): void {
    //console.log("espace", this.espace);
    this.userId = this.authService.getUserId()!;
    this.userType = this.authService.getRole()!;
    this.loadFavorites();
  }

  loadFavorites(): void {
    // Start loading
    this.isLoading = true;
    
    this.favoriService.getFavorites(this.userId, this.userType).subscribe({
      next: (data) => {
        try {
          // First filter by espace type
          const filteredMissions = data.filter((mission: any) => {
            if (this.espace === "Offre") {
              return ['CDI', 'CDD', 'ALTERNANCE'].includes(mission.descrip_mission.typeContrat);
            } else if (this.espace === "Mission") {
              return ['MISSION_CDI', 'FREELANCE'].includes(mission.descrip_mission.typeContrat);
            }
            return true; // if espace is neither, show all
          });

          this.countFavoris = filteredMissions.length;
          
          // If no filtered missions, stop loading and return
          if (filteredMissions.length === 0) {
            this.favorites = [];
            this.isLoading = false;
            return;
          }
          
          // Process each filtered mission to get the logo URL
          const missionObservables = filteredMissions.map((mission: any) => {
            const societeId = mission.id_societer ?? mission.user_id ?? mission.userId ?? mission.idSociete;
            const logoDirect =
              mission.logo && (String(mission.logo).startsWith('http') || String(mission.logo).startsWith('data:'))
                ? mission.logo
                : null;
            if (societeId == null) {
              return of({
                id: mission.idMission,
                title: mission.descrip_mission.mission_name,
                company: mission.descrip_mission.poste,
                ville: mission.ville?.nomdeville || '',
                pays: mission.pays?.nom || '',
                salary: mission.descrip_mission.salaire + ' DT',
                ref: mission.reference_code,
                type: mission.descrip_mission.typeContrat,
                experience: `${mission.profilDemande.annees_experiences} ans`,
                logo: logoDirect || 'assets/images/default-company.png',
              });
            }
            return this.documentService.getDocumentsByUserAndFolder(societeId, "ProfileImage").pipe(
              map(response => {
                const presignedUrl = response[0]?.presignedUrl || logoDirect || 'assets/images/default-company.png';
                return {
                  id: mission.idMission,
                  title: mission.descrip_mission.mission_name,
                  company: mission.descrip_mission.poste,
                  ville: mission.ville?.nomdeville || '',
                  pays: mission.pays?.nom || '',
                  salary: mission.descrip_mission.salaire + ' DT',
                  ref: mission.reference_code,
                  type: mission.descrip_mission.typeContrat,
                  experience: `${mission.profilDemande.annees_experiences} ans`,
                  logo: presignedUrl
                };
              }),
              catchError(error => {
                console.error('Error fetching profile image:', error);
                return of({
                  id: mission.idMission,
                  title: mission.descrip_mission.mission_name,
                  company: mission.descrip_mission.poste,
                  ville: mission.ville?.nomdeville || '',
                  pays: mission.pays?.nom || '',
                  salary: mission.descrip_mission.salaire + ' DT',
                  ref: mission.reference_code,
                  type: mission.descrip_mission.typeContrat,
                  experience: `${mission.profilDemande.annees_experiences} ans`,
                  logo: 'assets/images/default-company.png'
                });
              })
            );
          });

          forkJoin(missionObservables).subscribe({
            next: (processedMissions) => {
              this.favorites = processedMissions;
              this.isLoading = false; // Stop loading when data is processed
            },
            error: (error) => {
              console.error('Error processing some missions:', error);
              this.isLoading = false; // Stop loading on error
            }
          });
        } catch (error) {
          console.error('Error processing favorites data:', error);
          this.isLoading = false; // Stop loading on error
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des favoris :', err);
        this.isLoading = false; // Stop loading on error
      }
    });
  }

  removeFavorite(missionId: number): void {
    // Start removing loading state
    this.isRemoving = true;
    
    const jobToRemove = this.favorites.find(f => f.id === missionId);
    if (jobToRemove) {
      this.removedJobRef = jobToRemove.ref;
    }
    
    this.favoriService.removeFromFavorites(this.userId, missionId).subscribe({
      next: () => {
        this.favorites = this.favorites.filter(f => f.id !== missionId);
        this.countFavoris = this.favorites.length;
        this.showNotification = true;
        this.isRemoving = false; // Stop removing loading state
        
        setTimeout(() => {
          this.showNotification = false;
        }, 4000);
      },
      error: (err) => {
        console.error('Erreur lors de la suppression du favori :', err);
        this.isRemoving = false; // Stop removing loading state on error
      }
    });
  }

  // Helper method to refresh favorites (useful for external calls)
  refreshFavorites(): void {
    this.loadFavorites();
  }
}