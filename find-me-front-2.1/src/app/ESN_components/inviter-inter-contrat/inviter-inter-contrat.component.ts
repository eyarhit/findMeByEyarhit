import { Component, ElementRef, ViewChild, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRoutingServiceTwilio } from '../../services/api-routing-twilio.service';
import { HttpParams } from '@angular/common/http';
import { ApiRoutingServiceUser } from '../../services/api-routing-user.service';
import { ApiRoutingServiceQuiz } from '../../services/api-routing-quiz.service';
import { AuthService } from '../../services/auth.service';
import { DocumentServiceService } from '../../services/document-service.service';
@Component({
  selector: 'app-inviter-inter-contrat',

  templateUrl: './inviter-inter-contrat.component.html',
  styleUrl: './inviter-inter-contrat.component.scss'
})
export class InviterInterContratComponent implements OnInit {

  isSuccess = false;
  isPopupVisible = false;
  showHint = false;
  showPasswordHint = false;
  invalidCharEntered = false;
  registerFormTunisie: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  showPopup = false;
  country = '';
  // targetmarket='';
  num = '_';
  showSuccessPopup = false;
  close = false;
  phoneNumber = '';
  email = '';
  emailErrorMessage: string = '';
  isLoading: boolean = false;
  isLoadingVerification: boolean = false;
  phoneCode: boolean=false;
  files: File[] = [];
  fileName: string = '';
  errorcreation: boolean=false



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
    this.registerFormTunisie = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      country: [''],
      residenceType:['', Validators.required],
      num: [''],
      phoneNumber: ['', [Validators.required]],
      password: ['', [
        Validators.required,
        Validators.minLength(4),
        this.validatePasswordComplexity
      ]],
      confirmPassword: ['', Validators.required],
      jobIdentification: [false]
    }, { validators: this.matchPasswordValidator });
  }

  onSubmit() {
    this.isLoadingVerification=true;
    if (this.registerFormTunisie.valid ) {
        const formValue = this.registerFormTunisie.value;
        const registrationDTO = {
            userId: 0,
            firstName: formValue.firstName,
            lastName: formValue.lastName,
            email: formValue.email.toLowerCase(),
            phone: this.num + formValue.phoneNumber,
            password: formValue.password,
            residencetype:formValue.residenceType,
            country:this.country,
            address: '',
            dateOfBirth: '',
            sexe: '',
            nomSociete: '',
            linkedinUrl: '',
            role: 'CANDIDAT'
        };
    }
}  ngOnInit(): void {
    
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

  showPasswordHintPopup() {
    this.showPasswordHint = true;
  }

  hidePasswordHintPopup() {
    this.showPasswordHint = false;
  }

  validatePasswordComplexity(control: FormControl): { [key: string]: boolean } | null {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{4,}$/;
    if (!control.value || !passwordRegex.test(control.value)) {
      return { 'invalidPasswordFormat': true };
    }
    return null;
  }

  matchPasswordValidator(group: FormGroup): Validators | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      group.get('confirmPassword')?.setErrors(null);
    }
    return null;
  }



VerifyInscription() {
  //console.log('check');
  this.errorcreation = false;

  // Vérifiez si le formulaire est valide
  if (!this.registerFormTunisie.valid) {
    this.errorcreation = true;
  } 
  // Vérifiez si des fichiers ont été importés
  else if (this.files.length === 0) {
    this.errorcreation = true;
    alert('Veuillez importer au moins un document avant de continuer.');
  } 
  else {
    this.errorcreation = false;
    this.openPopup();
  }
}

  openPopup() {
    this.email = this.registerFormTunisie.get('email')?.value.toLowerCase();
    //console.log(this.email);
    this.emailErrorMessage='';
  }





  closePopup() {
    const toggleSwitch = document.getElementById('toggleSwitch') as HTMLInputElement;

    if (toggleSwitch) {
      toggleSwitch.checked = true;
      toggleSwitch.dispatchEvent(new Event('change'));
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onClose() {
    //console.log('Bouton de fermeture cliqué');
    this.showPopup = false;
  }

  openSuccessPopup() {
    this.showSuccessPopup = true;
  }

  navigateToVerifPage() {
    this.router.navigate(['/verif']);
  }


  limitInputLength(event: KeyboardEvent) {
    const inputElement = event.target as HTMLInputElement;
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];

    // Determine max length based on phoneCode
    let maxLength = 8; // default length
    if (this.num === '+33') {
        maxLength = 9;
    }

    // Prevent invalid characters (only digits allowed)
    if (!/^[0-9]$/.test(event.key) && !allowedKeys.includes(event.key)) {
        event.preventDefault();
        this.invalidCharEntered = true;
        return;
    } else {
        this.invalidCharEntered = false;
    }

    // Limit input length dynamically
    if (inputElement.value.length >= maxLength && !allowedKeys.includes(event.key)) {
        event.preventDefault();
    }
}

  onPhoneNumberInput() {
    this.registerFormTunisie.get('phoneNumber')?.updateValueAndValidity();
  }
  onCountryChange(): void {
    const country = this.registerFormTunisie.get('country')?.value;
  
    if (country) {
      this.country = country;
      this.phoneCode = false;
  
      if (country === 'Tunisie') {
        this.num = '+216';
        // this.targetmarket = 'Tunisien';
        this.registerFormTunisie.get('targetmarket')?.setValue('Tunisien');
      } else if (country === 'France') {
        this.num = '+33';
        // this.targetmarket = 'Francais';
        this.registerFormTunisie.get('targetmarket')?.setValue('Francais');
      } else {
        this.num = '';
      }
      //console.log('Selected country:', this.country);
    }
  }
  
  onPhoneCodeChange(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.num = selectedValue; // Update num with selected dropdown value
    //console.log('Selected phone code from dropdown:', this.num);
  }
  

  handleFilesAdded(newFiles: File[]): void {
    // Append new files, avoid duplicates if needed
    this.files = [...this.files, ...newFiles];

  }
  
}
