import { Component } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-session-login',
  templateUrl: './session-login.component.html',
  styleUrl: './session-login.component.scss'
})
export class SessionLoginComponent {
  userType: string | null = null;
  selectedNationality: string | null = null;
  nationalityError: boolean = false;
  userTypeError: boolean = false;
  /** Utilisé par la modale Freelancer / Portage (template actuellement commenté sur session-login). */
  showFreelancerPopup: boolean = false;
  constructor(private router: Router) {}

  onUserTypeSelected(type: string): void {
    // Branche freelancer : carte commentée dans le HTML ; réactiver la carte pour rouvrir la modale.
    if (type === 'freelancer') {
      this.showFreelancerPopup = true;
    } else {
      this.userType = type;
      this.userTypeError = false;
    }
  }

  /** Fermeture modale Freelancer / Portage (voir template commenté). */
  closePopup(): void {
    this.showFreelancerPopup = false;
    if (this.userType === 'freelancer') {
      this.userType = null;
    }
  }

  register(): void {
    if (this.userType === null) {
      this.userTypeError = true;
      return;
    }

    if (this.userType === 'ESN_ADMIN') {
      this.router.navigate(['/register-ESN']);
    } else if (this.userType === 'candidat') {
      this.router.navigate(['/register-candidat']);
    } else if (this.userType === 'FREELANCER') {
      // Inscription freelancer (flux associé à la carte / modale commentés pour le moment)
      this.router.navigate(['/register-freelancer']);
    } else if (this.userType === 'PORTAGE_SALARIAL') {
      // Inscription portage salarial (idem)
      this.router.navigate(['/register-portage-salarial']);
    } else {
      this.nationalityError = true;
    }
  }

  /** Choix précis dans la modale Freelancer vs Portage salarial (modale commentée dans le template). */
  selectFreelancerType(type: string): void {
    this.userType = type;
    this.userTypeError = false;
  }
}
