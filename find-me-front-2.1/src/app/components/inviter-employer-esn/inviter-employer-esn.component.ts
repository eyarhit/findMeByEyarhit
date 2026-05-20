import { Component, ElementRef, ViewChild, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRoutingServiceTwilio } from '../../services/api-routing-twilio.service';
import { HttpParams } from '@angular/common/http';
import { ApiRoutingServiceUser } from '../../services/api-routing-user.service';
import { ApiRoutingServiceQuiz } from '../../services/api-routing-quiz.service';
import { AuthService } from '../../services/auth.service';
import { DocumentServiceService } from '../../services/document-service.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-inviter-employer-esn',
  templateUrl: './inviter-employer-esn.component.html',
  styleUrl: './inviter-employer-esn.component.scss'
})
export class InviterEmployerESNComponent implements OnInit {
  @Input() userRole: string = '';
  isSuccess = false;
  isPopupVisible = false;
  showHint = false;
  invalidCharEntered = false;
  registerFormTunisie: FormGroup;
  showPopup = false;
  country = '';
  num = '_';
  showSuccessPopup = false;
  close = false;
  phoneNumber = '';
  email = '';
  emailErrorMessage: string = '';
  isLoading: boolean = false;
  isLoadingVerification: boolean = false;
  phoneCode: boolean = false;
  @Input() id_societer: number = 0;     
  fileName: string = '';
  targetmarket: string = '';
  errorcreation: boolean = false;
  generatedPassword: string = ''; // Pour stocker le mot de passe généré
  nomSociete: string = '';

  @ViewChild('metierSelect') metierSelect!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private apiRoutingServiceTwilio: ApiRoutingServiceTwilio,
    private apiRoutingServiceUser: ApiRoutingServiceUser,
    private apiRoutingServiceQuiz: ApiRoutingServiceQuiz,
    private authService: AuthService, 
    private documentService: DocumentServiceService
  ) {
    // Form sans les champs password
    this.registerFormTunisie = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      country: [''],
      phoneNumber: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
const storedProfile = sessionStorage.getItem('profile');
const profile = storedProfile ? JSON.parse(storedProfile) : null;
this.nomSociete = profile?.nomSociete || '';
this.targetmarket = profile?.targetmarket;
if(this.targetmarket==="Tunisien")
  {
    this.country="Tunisie"
  }else{
    this.country="France"
  }
    if (this.country) {
      this.phoneCode = false;
  
      if (this.country === 'Tunisie') {
        this.num = '+216';
      } else if (this.country === 'France') {
        this.num = '+33';
      } else {
        this.num = '';
      }
      //console.log('Selected country:', this.country);
    }
    if(this.id_societer===null){
      this.id_societer=this.authService.getUserId()!;
    }
    this.generatedPassword = this.generateSecurePassword();
    // //console.log('Mot de passe généré:', this.generatedPassword);
    // //console.log('User Role:',this.userRole);
  }

  /**
   * Génère un mot de passe sécurisé automatiquement
   * Format: majuscule + minuscules + chiffres + caractère spécial
   */
  generateSecurePassword(): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '@$!%*?&';
    
    let password = '';
    
    // Assurer au moins un caractère de chaque type
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // Compléter avec des caractères aléatoires pour atteindre 8 caractères
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = password.length; i < 8; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Mélanger les caractères pour éviter un pattern prévisible
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

onSubmit() {
    this.isLoadingVerification = true;
    
    // Afficher le message d'attente
    Swal.fire({
      title: 'Enregistrement en cours',
      html: 'Veuillez patienter...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    if (this.registerFormTunisie.valid) {
      const formValue = this.registerFormTunisie.value;
      const registrationDTO = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email.toLowerCase(),
        phone: this.num + formValue.phoneNumber,
        password: this.generatedPassword,
        residencetype: formValue.residenceType,
        country: this.country,
        targetmarket: this.country === 'Tunisie' ? 'Tunisien' : 
                    (this.country === 'France' ? 'Francais' : this.country),
        address: '',
        dateOfBirth: '',
        sexe: '',
        nomSociete: this.nomSociete,
        linkedinUrl: '',
        id_responsable: this.authService.getUserId(),
        id_societer: this.id_societer,
        role: this.userRole
      };

      this.apiRoutingServiceUser.requestApi('/register', registrationDTO)
        .subscribe({
          next: (response) => {
            Swal.close(); // Fermer le loader
            this.isLoadingVerification = false;
            this.showSuccessAlert("Compte créé avec succès !", "L'enregistrement a été effectué avec succès");
            this.authService.notifyDataUpdate();
            this.registerFormTunisie.reset(); // Réinitialiser le formulaire
          },
          error: (error) => {
            Swal.close(); // Fermer le loader
            this.isLoadingVerification = false;
            console.error('Registration failed:', error);
            this.emailErrorMessage = "Email déjà utilisé";
          }
        });
    } else {
      Swal.close(); // Fermer le loader si le formulaire est invalide
      this.isLoadingVerification = false;
    }
  }

  private showSuccessAlert(title: string, text: string): void {
    Swal.fire({
      title,
      text,
      icon: 'success',
      confirmButtonText: 'Parfait !',
      confirmButtonColor: '#6c63ff',
    });
  }
   
  moveToNext(event: Event, nextInput: HTMLInputElement | null) {
    const input = event.target as HTMLInputElement;
    if (input.value.length === 1 && nextInput) {
      nextInput.focus();
    }
  }

  showEmailHint() {
    this.showHint = true;
  }

  hideEmailHint() {
    this.showHint = false;
  }

  VerifyInscription() {
    //console.log('check');
    this.errorcreation = false;

    // Vérifier si le formulaire est valide
    if (!this.registerFormTunisie.valid) {
      
      this.errorcreation = true;
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.registerFormTunisie.controls).forEach(key => {
        this.registerFormTunisie.get(key)?.markAsTouched();
      });
    } 
    else {
      
      this.errorcreation = false;
      this.openPopup();
    }
  }

  openPopup() {
    this.email = this.registerFormTunisie.get('email')?.value.toLowerCase();
    //console.log(this.email);
    this.emailErrorMessage = '';
    // Générer un nouveau mot de passe si besoin
    if (!this.generatedPassword) {
      this.generatedPassword = this.generateSecurePassword();
    }
    this.onSubmit()
  }

  closePopup() {
    const toggleSwitch = document.getElementById('toggleSwitch') as HTMLInputElement;
    if (toggleSwitch) {
      toggleSwitch.checked = true;
      toggleSwitch.dispatchEvent(new Event('change'));
    }
  }

  onClose() {
    //console.log('Bouton de fermeture cliqué');
    this.showPopup = false;
  }



  navigateToVerifPage() {
    this.router.navigate(['/verif']);
  }

  limitInputLength(event: KeyboardEvent) {
    const inputElement = event.target as HTMLInputElement;
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];

    let maxLength = 8;
    if (this.num === '+33') {
      maxLength = 9;
    }

    if (!/^[0-9]$/.test(event.key) && !allowedKeys.includes(event.key)) {
      event.preventDefault();
      this.invalidCharEntered = true;
      return;
    } else {
      this.invalidCharEntered = false;
    }

    if (inputElement.value.length >= maxLength && !allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  onPhoneNumberInput() {
    this.registerFormTunisie.get('phoneNumber')?.updateValueAndValidity();
  }

  // onCountryChange(): void {
  //   const country = this.registerFormTunisie.get('country')?.value;
  //   if (country) {
  //     this.country = country;
  //     this.phoneCode = false;
  
  //     if (country === 'Tunisie') {
  //       this.num = '+216';
  //     } else if (country === 'France') {
  //       this.num = '+33';
  //     } else {
  //       this.num = '';
  //     }
  //     //console.log('Selected country:', this.country);
  //   }
  // }
  
  onPhoneCodeChange(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.num = selectedValue;
    //console.log('Selected phone code from dropdown:', this.num);
  }


}