import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CvService } from '../../services/cv.service';
import { AuthService } from '../../services/auth.service';
import { ApiRoutingServiceUser } from '../../services/api-routing-user.service';
import { Cv } from '../../_model/Cv';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  login: FormGroup;
  showPassword = false;
  private jwtHelper = new JwtHelperService();
  authErrorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private apiRoutingService: ApiRoutingServiceUser,
    private authService: AuthService,
    private router: Router,
    private cvService: CvService
  ) {
    this.login = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {}

  private isTokenExpired(token: string): boolean {
    return this.jwtHelper.isTokenExpired(token);
  }

  private decodeToken(token: string): any {
    return this.jwtHelper.decodeToken(token);
  }

  onSubmit(): void {
    if (!this.login.valid) {
      Object.keys(this.login.controls).forEach((key) => {
        this.login.get(key)?.markAsTouched();
      });
      return;
    }

    const { email, password } = this.login.value;
    const loginPayload = {
      email: email.toLowerCase(),
      password
    };

    this.apiRoutingService.requestLoginApi('/authenticate', loginPayload).subscribe({
      next: (response: any) => {
        const token = response.token;
        if (!token) {
          this.authErrorMessage = "Token manquant dans la réponse !";
          return;
        }

        this.authService.login(token, password);
        this.authService.notifyProfileUpdate();

        const role = this.authService.getRole();
        this.redirectUser(role || '');
        this.authErrorMessage = null;
      },
      error: (error) => {
        let errorMessage = "Erreur inconnue lors de l'authentification.";
        if (error.error && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        this.authErrorMessage = errorMessage;
      }
    });
  }
  

  private createEmptyCv(userId: number): void {
    const emptyCv: Cv = {
      userId,
      competences: [
        {
          langageBallsage: '',
          languageProgrammation: '',
          framework: '',
          bibliotheque: '',
          api: '',
          db: '',
          systemExploitation: '',
          conception: '',
          methodologie: '',
          designPattern: '',
          architechture: '',
          outils: ''
        }
      ],
      educations: [
        {
          university: '',
          diplome: '',
          dateDebut: '',
          dateFin: ''
        }
      ],
      experiences: [
        {
          entreprise: '',
          dateDebut: '',
          dateFin: '',
          poste: '',
          nomProjet: '',
          client: '',
          equipe: '',
          description: '',
          travailRealise: '',
          environnement: ''
        }
      ],
      langues: [
        {
          name: '',
          niveau: ''
        }
      ]
    };

    this.cvService.createCv(userId, emptyCv).subscribe(
      (response) => {
        //console.log('✅ CV vide créé avec succès:', response);
      },
      (error) => {
        console.error('❌ Erreur lors de la création du CV:', error);
      }
    );
  }

  private redirectUser(role: string): void {
    //console.log('🔄 Redirection en cours pour rôle:', role);

    switch (role) {
      case 'CANDIDAT':
        this.router.navigate(['/cv']);
        break;
      case 'FREELANCER':
        this.router.navigate(['/cv']);
        break;
      case 'ESN_COMMERCIAL':
        this.router.navigate(['/gestion-employer/esn-commercial']);
        break;        
      case 'ESN_ADMIN':
        this.router.navigate(['/gestion-employer/esn-commercial']);
        break;      
      case'PORTAGE_SALARIAL':
        this.router.navigate(['/cv']);
        break;
      case 'CHARGEDERECRUTEMENT':
        this.router.navigate(['/Offres/Liste']);
        break;
      case 'ADMIN':
        this.router.navigate(['/utilisateur']);
        break;
      default:
        console.warn('Rôle inconnu. Redirection vers /login.');
        this.router.navigate(['/login']);
        break;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
