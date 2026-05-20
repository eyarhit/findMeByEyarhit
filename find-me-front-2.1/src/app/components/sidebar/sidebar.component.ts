import { Component, Inject, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ApiRoutingServiceUser } from '../../services/api-routing-user.service';
import { DocumentServiceService } from '../../services/document-service.service';
import { Subscription } from 'rxjs';
import { CvService } from '../../services/cv.service';

@Component({
  selector: 'app-sidebar-espace',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarEspaceComponent implements OnInit, OnDestroy {

  TitreProfile: string | null = null;
  ImageProfile: string | null = null;
  profile: any = null;
  userId: number | null = null;
  email: string | null = null;
  activeSection: string = 'accueil';
  urlEndString: string = '';
  private subscription?: Subscription;
  titreDeProfil: string=''
  role: string=''

  constructor(
    private apiRoutingServiceUser: ApiRoutingServiceUser,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private authService: AuthService,
    private documentService: DocumentServiceService,
    private cvService: CvService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      // Subscribe to auth state changes
      this.subscription = this.authService.authStateChange.subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.loadProfileDataWithCache();
        } else {
          this.clearProfile();
        }
      });

      // Initial load if authenticated
      if (this.authService.isAuthenticated()) {
        this.loadProfileDataWithCache();
      }
    }
  }
  

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.role=this.authService.getRole()!;
    //console.log(this.role)
  }

  /** Libellé affiché sous le nom dans la sidebar ; le rôle JWT (`role`) ne change pas. */
  get roleDisplayLabel(): string {
    if (this.role === 'ESN_ADMIN') {
      return 'Ressource Humaine (RH)';
    }
    return this.role;
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private loadProfileDataWithCache(): void {
    // Try to load from sessionStorage first
    const storedProfile = sessionStorage.getItem('profile');
    const storedImageProfile = sessionStorage.getItem('ImageProfile');
    const storedTitreProfile = sessionStorage.getItem("TitreProfile");

    if (storedProfile && storedImageProfile && storedTitreProfile ) {
      this.profile = JSON.parse(storedProfile);
      this.ImageProfile = storedImageProfile;
      this.TitreProfile = storedTitreProfile;
      //console.log('✅ Loaded profile and image from sessionStorage');
    } else {
      // If not in sessionStorage, load from API
      this.loadProfileData();
    }
  }

  private loadProfileData(): void {
    const token = this.authService.getToken();
    if (!token) {
      console.error('❌ Token non trouvé !');
      return;
    }

    const decoded = this.authService.getDecodedToken();
    this.email = decoded?.email ?? null;
    this.userId = decoded?.userId ?? null;

    if (!this.email || !this.userId) {
      console.error('❌ Données utilisateur manquantes dans le token !');
      return;
    }

    this.loadProfileImage(token);
    this.loadUserProfile(token);
    const role = this.authService.getRole() || '';
    if (['CANDIDAT', 'FREELANCER', 'PORTAGE_SALARIAL', 'INTERCONTRAT'].includes(role)) {
      this.loadTitreProfile(this.userId);
    }
  }

  private loadProfileImage(token: string): void {
    this.documentService.getDocumentsByUserAndFolder(this.userId!, "ProfileImage").subscribe(
      response => {
        if (response && response.length > 0) {
          this.ImageProfile = response[0].presignedUrl;
          // Store in sessionStorage
          if (this.ImageProfile) {
            sessionStorage.setItem('ImageProfile', this.ImageProfile);
          } else {
            sessionStorage.removeItem('ImageProfile');
          }
          
        }
      },
      error => {
        console.error('Erreur lors du chargement de l\'image de profil:', error);
      }
    );
  }

  private loadUserProfile(token: string): void {
    this.apiRoutingServiceUser.getUserByEmail(this.email!, token).subscribe(
      (response: any) => {  
        this.profile = response;
        // //console.log('✅ Profil utilisateur chargé:', response);
        // Store in sessionStorage
        sessionStorage.setItem('profile', JSON.stringify(this.profile));
      },
      (error: any) => {
        console.error('❌ Erreur lors du chargement du profil:', error);
      }
    );
  }
  private loadTitreProfile(_userId: number): void {
    this.cvService.getCvByUserId(this.userId!).subscribe({
      next: (cv) => {
        if (cv?.titreDeProfil) {
          sessionStorage.setItem('TitreProfile', cv.titreDeProfil);
        }
      },
      error: () => {
        /* Absence de CV : attendu pour certains profils */
      },
    });
  }
  private clearProfile(): void {
    this.ImageProfile = null;
    this.TitreProfile=null;
    this.profile = null;
    this.userId = null;
    this.email = null;
    sessionStorage.removeItem('profile');
    sessionStorage.removeItem('ImageProfile');
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      this.authService.logout();
      this.router.navigate(['/acceuil-find-me']).then(() => {
        window.location.reload();
      });
    }
  }
 urlContains(segment: string): boolean {
  // router.url returns the current URL path, including all segments
  return this.router.url.includes(segment);
}
}
