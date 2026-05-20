import { Component, Inject, PLATFORM_ID, OnInit, OnDestroy, ElementRef, HostListener, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { DocumentServiceService } from '../../services/document-service.service';
import { ApiRoutingServiceUser } from '../../services/api-routing-user.service';
import { CvService } from '../../services/cv.service';

@Component({
  selector: 'app-Navbar',
  templateUrl: './Navbar.component.html',
  styleUrls: ['./Navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  ImageProfile: string | null = null;
  profile: any = null;
  userId: number | null = null;
  email: string | null = null;
  roleFromToken: string | null = null;
  /** Aligné sur le token valide : évite Connexion + profil en même temps si le claim `role` varie. */
  isLoggedIn = false;
  /** Empêche le rendu auth côté SSR avant lecture du token navigateur. */
  authResolved = false;

  isMenuOpen = false;
  showDropdown = false;
  showSideBar = false;

  /** Pages invité : header minimal (Accueil + Connexion / Inscription uniquement). */
  isPublicGuestPage = false;

  /** Pages login / inscription : navbar = Accueil + Connexion + Inscription uniquement. */
  private readonly minimalAuthNavPrefixes = [
    '/login',
    '/session-login',
    '/register-candidat',
    '/register-freelancer',
    '/register-portage-salarial',
    '/register-ESN',
    '/mot-de-passe-oublier',
    '/reinitialiser-mot-passe',
  ];

  private subscription = new Subscription();

  @ViewChild('dropdownToggle') dropdownToggle!: ElementRef;
  @ViewChild('dropdownMenu') dropdownMenu!: ElementRef;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private apiRoutingServiceUser: ApiRoutingServiceUser,
    private router: Router,
    private authService: AuthService,
    private documentService: DocumentServiceService,
    private elementRef: ElementRef,
    private cvService: CvService,
  ) {
    // Avant le 1er rendu : évite d’afficher Connexion/Inscription alors qu’un token valide existe
    if (isPlatformBrowser(this.platformId)) {
      this.applyAuthState();
      this.authResolved = true;
    }
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.updatePublicGuestPageFlag(this.router.url);
    this.subscription.add(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe((e) => this.updatePublicGuestPageFlag(e.urlAfterRedirects))
    );
    this.subscription.add(
      this.authService.authStateChange.subscribe(() => this.applyAuthState())
    );
  }

  /** Accueil : uniquement pages login / inscription (jamais en session candidat ou RH). */
  get showAccueilNav(): boolean {
    return this.authResolved && this.isPublicGuestPage && !this.isLoggedIn;
  }

  /** Liens métier (offres, CV, admin…) : session connectée uniquement. */
  get showSessionNav(): boolean {
    return this.authResolved && this.isLoggedIn;
  }

  get showDossierCompetencesNav(): boolean {
    return (
      this.showSessionNav &&
      !['ADMIN', 'ESN_ADMIN', 'ESN_COMMERCIAL', 'CHARGEDERECRUTEMENT'].includes(
        this.roleFromToken ?? ''
      )
    );
  }

  get showOffresNav(): boolean {
    return this.showSessionNav && this.roleFromToken === 'CANDIDAT';
  }

  /** RH : lien unique vers l'espace offres (pas de gestion membres). */
  get showRhOffresNav(): boolean {
    return (
      this.showSessionNav &&
      (this.roleFromToken === 'ESN_ADMIN' ||
        this.roleFromToken === 'CHARGEDERECRUTEMENT')
    );
  }

  private updatePublicGuestPageFlag(url: string): void {
    const path = (url.split('?')[0] || '/').replace(/\/$/, '') || '/';
    this.isPublicGuestPage = this.minimalAuthNavPrefixes.some(
      (prefix) => path === prefix || path.startsWith(prefix + '/')
    );
  }

  private applyAuthState(): void {
    const token = this.authService.getToken();
    const authed = this.authService.isAuthenticated();
    if (!authed || !token) {
      this.isLoggedIn = false;
      this.clearProfile();
      return;
    }
    /** Token valide ⇒ toujours masquer Connexion / Inscription (ne pas repasser à déconnecté si un claim manque) */
    this.isLoggedIn = true;
    this.handleToken(token);
  }

  private handleToken(token: string): void {
    this.roleFromToken = this.authService.getRole();
    this.email = this.authService.getEmail();
    this.userId = this.authService.getUserId();

    if (!this.email || this.userId == null) {
      console.warn(
        '⚠️ Email ou userId introuvable dans le JWT — barre connectée, chargement profil limité.'
      );
      return;
    }

    const storedProfile = sessionStorage.getItem('profile');
    const storedImageProfile = sessionStorage.getItem('ImageProfile');

    if (storedProfile && storedImageProfile) {
      try {
        this.profile = JSON.parse(storedProfile);
        this.ImageProfile = storedImageProfile;
      } catch {
        sessionStorage.removeItem('profile');
        sessionStorage.removeItem('ImageProfile');
        this.loadProfileData(token);
      }
    } else {
      this.loadProfileData(token);
    }
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadProfileData(token: string): void {
    this.documentService.getDocumentsByUserAndFolder(this.userId!, 'ProfileImage').subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.ImageProfile = response[0].presignedUrl;
          //console.log('Document uploaded successfully:', this.ImageProfile);
  
          // Store ImageProfile URL in sessionStorage
          if (this.ImageProfile) {
            sessionStorage.setItem('ImageProfile', this.ImageProfile);
          } else {
            sessionStorage.removeItem('ImageProfile');
          }
        }
      },
      error: (error) => {
        console.error('Erreur lors de la récupération de l\'image de profil :', error);
      }
    });
  
    this.apiRoutingServiceUser.getUserByEmail(this.email!, token).subscribe({
      next: (response) => {
        this.profile = response;
        // //console.log('✅ Infos personnelles récupérées avec succès :', response);
        sessionStorage.setItem('profile', JSON.stringify(this.profile));
      },
      error: (error) => {
        console.error('❌ Erreur lors de la récupération des infos personnelles', error);
      }
    });
    const role = this.authService.getRole();
    if (role && ['CANDIDAT', 'FREELANCER', 'PORTAGE_SALARIAL', 'INTERCONTRAT'].includes(role)) {
      this.cvService.getCvByUserId(this.userId!).subscribe({
        next: (cv) => {
          if (cv?.titreDeProfil) {
            sessionStorage.setItem('TitreProfile', cv.titreDeProfil);
          }
        },
        error: () => {
          /* Pas de CV ou erreur API : normal pour un compte sans dossier CV */
        },
      });
    }
  }
  
  /** Déconnexion réelle ou absence de token */
  private clearProfile(): void {
    this.isLoggedIn = false;
    this.ImageProfile = null;
    this.profile = null;
    this.userId = null;
    this.email = null;
    this.roleFromToken = null;
  }

  logout(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.authService.logout();
    this.router.navigate(['/acceuil-find-me']).then(() => {
      window.location.reload();
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleSideBar(): void {
    this.showSideBar = !this.showSideBar;
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  /**
   * Génère les initiales de l'utilisateur à partir de son prénom et nom
   * @returns Les initiales de l'utilisateur ou un placeholder par défaut
   */
  getInitials(): string {
    if (this.profile && this.profile.firstName && this.profile.lastName) {
      const firstInitial = this.profile.firstName.charAt(0).toUpperCase();
      const lastInitial = this.profile.lastName.charAt(0).toUpperCase();
      return `${firstInitial}${lastInitial}`;
    } else if (this.email) {
      // Fallback to first letter of email if profile not loaded
      return this.email.charAt(0).toUpperCase();
    }
    return 'U'; // Default fallback (User)
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showDropdown) return;

    const target = event.target as HTMLElement;
    const clickedToggle = this.dropdownToggle?.nativeElement.contains(target);
    const clickedMenu = this.dropdownMenu?.nativeElement.contains(target);

    if (!clickedToggle && !clickedMenu) {
      this.showDropdown = false;
    }
  }
}
