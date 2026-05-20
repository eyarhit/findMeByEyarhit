  import { Component, Input, ViewChildren, QueryList, ElementRef, AfterViewInit, Renderer2 } from '@angular/core';
  import { Router } from '@angular/router';
  import { FavoriService } from '../../services/favori.service';
  import { AuthService } from '../../services/auth.service';
  

interface Job {
  id: number;
  title: string;
  poste: string;
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
  selector: 'app-job-description',
  templateUrl: './mission-description.component.html',
  styleUrl: './mission-description.component.scss'
})

export class MissionDescriptionComponent {
   constructor(private router: Router ,   private favoriService: FavoriService, private authService: AuthService
   ){}
    @Input() visiteur:boolean=false;
  storedtargetmarket: string | null = null;
    IsMission:boolean=false;
   showNotification = false;
   @Input() espace ="";
    @Input() job!: Job;
    @Input() isEmpty = false;
  ngOnInit(): void {
    // console.log(this.espace)
    // Extract the mission ID from the route parameter
  // Get target market from session storage
  const profile = JSON.parse(sessionStorage.getItem('profile') || '{}');
  this.storedtargetmarket = profile.targetmarket || '';}
    viewMission(jobId: number): void {
    if (this.espace === 'Mission publier') {
      if (this.visiteur) this.IsMission = true;
      else this.router.navigate(['/MissionPublierDetails', jobId]);
    } else if (this.espace === 'Offres publier') {
      if (this.visiteur) this.IsMission = true;
      else this.router.navigate(['/OffrePublierDetails', jobId]);
    } else if (this.espace === 'Liste Mission') {
      if (this.visiteur) this.IsMission = true;
      else this.router.navigate(['/MissionDetails', jobId]);
    } else if (this.espace === 'Liste Offres') {
      if (this.visiteur) this.IsMission = true;
      else this.router.navigate(['/OffreDetails', jobId]);
    } else if (
      this.authService.getRole() === 'FREELANCER' ||
      this.authService.getRole() === 'PORTAGE_SALARIAL' ||
      this.authService.getRole() === 'ESN_ADMIN' ||
      this.authService.getRole() === 'ESN_COMMERCIAL'
    ) {
      if (this.visiteur) this.IsMission = true;
      else this.router.navigate(['/MissionDetails', jobId]);
    } else if (
      this.authService.getRole() === 'CANDIDAT' ||
      this.authService.getRole() === 'ESN_ADMIN' ||
      this.authService.getRole() === 'ESN_COMMERCIAL'
    ) {
      if (this.visiteur) this.IsMission = true;
      else this.router.navigate(['/OffreDetails', jobId]);
    }
  }
 
    addToFavorites(): void {
      const userId = this.authService.getUserId();
      const userType = this.authService.getRole();
    
      if (!userId || !userType) return;
    
      this.favoriService.addToFavorites(userId, this.job.id, userType).subscribe({
        next: () => {
          //console.log("✅ Mission ajoutée aux favoris");
          this.showNotification = true;
          setTimeout(() => this.showNotification = false, 4000);
        },
        error: (err) => console.error("❌ Erreur ajout favoris", err)
      });
    
  }
}
