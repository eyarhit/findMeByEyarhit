import { Component, ElementRef, ViewChild, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRoutingServiceTwilio } from '../../services/api-routing-twilio.service';
import { HttpParams } from '@angular/common/http';
import { ApiRoutingServiceUser } from '../../services/api-routing-user.service';
import { ApiRoutingServiceQuiz } from '../../services/api-routing-quiz.service';
import { AuthService } from '../../services/auth.service';
import { DocumentServiceService } from '../../services/document-service.service';
import { apiRoutingServiceFlusk } from '../../services/api-routing-flusk.services';

@Component({
  selector: 'app-register-freelancer',
  templateUrl: './register-freelancer.component.html',
  styleUrls: ['./register-freelancer.component.scss']
})
export class RegisterFeelancerComponent implements OnInit {
  role: string = '';
  isPopupVisible = false;
  showHint = false;
  showPasswordHint = false;
  invalidCharEntered = false;
  registerFormTunisie: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  showPopup = false;
  country = '';
  targetmarket='';
  residencetype='';
  num = '_';
  showSuccessPopup = false;
  close = false;
  phoneNumber = '';
  email = '';
  ResidenceTypeValid=false;
  emailErrorMessage: string = '';
  docErrorMessage: string = '';
  verfidoc: boolean = false;
  isLoading: boolean = false;
  isLoadingVerification: boolean = false;
  phoneCode: boolean=false;
  files: File[] = [];
  fileName: string = '';
  errorcreation: boolean=false
  isExtrait =false;

  otp1: string = '';
  otp2: string = '';
  otp3: string = '';
  otp4: string = '';
  otp5: string = '';
  otp6: string = '';

  @ViewChild('metierSelect') metierSelect!: ElementRef;

  constructor(
    private apiRoutingServiceFlusk: apiRoutingServiceFlusk,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private apiRoutingServiceTwilio: ApiRoutingServiceTwilio,
    private apiRoutingServiceUser: ApiRoutingServiceUser,
    private apiRoutingServiceQuiz: ApiRoutingServiceQuiz,
    private authService: AuthService, 
    private documentService: DocumentServiceService
  ) {
    // Initialisation du form sans nomSociete pour l'instant
    this.registerFormTunisie = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      country: [''],
      targetmarket: [''],
      residenceType: [''],
      num: [''],
      phoneNumber: ['', [Validators.required]],
      password: ['', [
        Validators.required,
        Validators.minLength(4),
        this.validatePasswordComplexity
      ]],
      confirmPassword: ['', Validators.required],
      jobIdentification: [false],
      nomSociete: [''] // Toujours présent mais avec validation conditionnelle
    }, { validators: this.matchPasswordValidator });
  }

  ngOnInit(): void {
    this.role = this.route.snapshot.data['role'];
    //console.log("UserRole", this.role);
    
    // Configuration du champ nomSociete après récupération du rôle
    this.configureNomSocieteField();
  }

  private configureNomSocieteField(): void {
    const nomSocieteControl = this.registerFormTunisie.get('nomSociete');
    
    if (this.role === "ESN_ADMIN") {
      // Rendre le champ obligatoire pour ESN_ADMIN
      nomSocieteControl?.setValidators([Validators.required]);
    } else {
      // Retirer les validators pour les autres rôles
      nomSocieteControl?.clearValidators();
      nomSocieteControl?.setValue(''); // Optionnel: vider la valeur
    }
    
    // Mettre à jour la validation
    nomSocieteControl?.updateValueAndValidity();
  }

  // Getter pour vérifier si nomSociete doit être affiché
  get shouldShowNomSociete(): boolean {
    return this.role === "ESN_ADMIN";
  }

  get otpString(): string {
    return `${this.otp1}${this.otp2}${this.otp3}${this.otp4}${this.otp5}${this.otp6}`;
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
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{4,}$/;
    if (!passwordRegex.test(control.value)) {
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

  setResidenceType(value: string) {
    this.registerFormTunisie.get('residenceType')!.setValue(value);
    //console.log(this.registerFormTunisie.get('residenceType'));
  }

  onSubmit() {
    this.isLoadingVerification = true;
    if (this.registerFormTunisie.valid && this.otpString) {
      const formValue = this.registerFormTunisie.value;
      const registrationDTO = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email.toLowerCase(),
        phone: this.num + formValue.phoneNumber,
        password: formValue.password,
        residencetype: formValue.residenceType,
        country: this.country,
        targetmarket: this.targetmarket,
        address: '',
        dateOfBirth: '',
        sexe: '',
        id_societer:null,
        id_responsable:null,
        nomSociete: this.role === "ESN_ADMIN" ? formValue.nomSociete : '', // Gérer conditionnellement
        linkedinUrl: '',
        role: this.role
      };
      
      //console.log(registrationDTO);
      //console.log(this.otpString);
      const params = new HttpParams().set('otp', this.otpString);

      this.apiRoutingServiceUser.requestApi('/register', registrationDTO, params)
        .subscribe({
          next: (response) => {
            //console.log('Registration successful:', response);
            this.isLoadingVerification = false;
            this.openSuccessPopup();
            //console.log("email checking", registrationDTO.email);
            this.onUpload(registrationDTO.email);
          },
          error: (error) => {
            console.error('Registration failed:', error);
            alert(`Registration failed: ${error.error}`);
          }
        });
    } else {
      Object.keys(this.registerFormTunisie.controls).forEach(key => {
        this.registerFormTunisie.get(key)?.markAsTouched();
      });
    }
  }

  VerifyInscription(){
    this.verfidoc = true;
    this.emailErrorMessage = '';
    this.docErrorMessage = '';
    this.errorcreation = false;
    
    if(!this.registerFormTunisie.valid){
      this.errorcreation = true;
    }
    else if(this.registerFormTunisie.valid){
      this.errorcreation = false;
      this.isLoading = true;
      if(this.files.length === 0 && this.role==="ESN_ADMIN"){
        this.errorcreation=true;
        this.docErrorMessage = "Vous devriez mettre votre document";
         return}
      if(this.files.length != 0){
        // this.verfidoc = false;
        const formData = new FormData();
        formData.append('file', this.files[0]);
        
        // this.apiRoutingServiceFlusk.requestApi('/parse-document/', formData).subscribe(
        //   (response: any) => {
        //     this.isLoading = false;
        //     if((response.document_type === "Kbis Document" && this.targetmarket === "Francais") ||
        //        (response.document_type === "RNE Document" && this.targetmarket === "Tunisien") ||
        //        (response.document_type === "Kbis/RNE (Contains characteristics of both)")){
              this.openPopup();
        //       this.verfidoc = true;
        //     }
        //     else {
        //       this.docErrorMessage = "document invalide";
        //     }
        //   },
        //   (error) => {
        //     //console.log(error);
        //   }
        // );
      } else {
        this.openPopup();
      }
    }
  }

  openPopup() {
    this.email = this.registerFormTunisie.get('email')?.value.toLowerCase();
    //console.log(this.email);
    this.emailErrorMessage = '';
    this.docErrorMessage = '';
    this.sendOTP(this.email);
  }

  sendOTP(email: string) {
    const params = new HttpParams().set('email', email);
    //console.log(email);
    this.apiRoutingServiceUser.requestApi('/generate', params).subscribe({
      next: (response: any) => {
        //console.log('OTP sent successfully:', response);
        this.isLoading = false;
        this.showPopup = true;
      },
      error: (error: any) => {
        console.error('Error sending OTP:', error);
        if (error.status === 400) {
          this.isLoading = false;
          this.emailErrorMessage = 'Email déjà utilisé';
        } else {
          alert('Error Serveur not working. Please try again.');
        }
      }
    });
  }

  resendOTP() {
    this.sendOTP(this.email);
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

  onCountryChange(): void {
    const country = this.registerFormTunisie.get('country')?.value;
  
    if (country) {
      this.country = country;
      this.phoneCode = false;
  
      if (country === 'Tunisie') {
        this.num = '+216';
        this.targetmarket = 'Tunisien';
        this.registerFormTunisie.get('targetmarket')?.setValue('Tunisien');
      } else if (country === 'France') {
        this.num = '+33';
        this.targetmarket = 'Francais';
        this.registerFormTunisie.get('targetmarket')?.setValue('Francais');
      } else {
        this.num = '';
      }
      //console.log('Selected country:', this.country);
    }
  }
  
  onMarcherChange(): void {
    const targetmarket = this.registerFormTunisie.get('targetmarket')?.value;
  
    if (targetmarket) {
      this.targetmarket = targetmarket;
      if (this.country === 'Tunisie' && targetmarket === 'Francais') {
        this.phoneCode = true;
        this.num = '+33';
      } else {
        this.files = [];
        this.registerFormTunisie.get('residenceType')?.setValue('');
        this.phoneCode = false;
        if (targetmarket === 'Tunisien') {
          this.num = '+216';
          this.targetmarket = 'Tunisien';
        } else if (targetmarket === 'Francais') {
          this.num = '+33';
          this.targetmarket = 'Francais';
        } else {
          this.num = '';
        }
      }
      //console.log(this.targetmarket);
    }
  }
  
  onPhoneCodeChange(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.num = selectedValue;
    //console.log('Selected phone code from dropdown:', this.num);
  }
  
  openPopupCarteSejour(){
    this.isExtrait = true;
  }
  
  closePopupCarteSejour(){
    this.isExtrait = false;
  }

  isResidenceTypeValid(): void {
    const residenceType = this.registerFormTunisie.get('residenceType')?.value;
    //console.log(residenceType);
    
    if (residenceType === 'Visa' || residenceType === 'Carte Sejour'|| residenceType === 'Permis De Travail') {
      this.ResidenceTypeValid = true;
    } else {
      this.ResidenceTypeValid = false;
    }
  }
  
  handleFilesAdded(newFiles: File[]): void {
    this.files = [...this.files, ...newFiles];
  }
  
  handleFileRemoved(index: number): void {
    this.files.splice(index, 1);
    this.files = [...this.files];
  }
  
  onUpload(email: string): void {
    if (this.files.length > 0) {
      const allFiles = [...this.files];
      
      allFiles.forEach(file => {
        const fileName = this.fileName ? this.fileName : file.name;
        this.documentService.uploadDocument(file, fileName, "Extrait", email).subscribe(
          response => {
            //console.log('Document uploaded successfully:', response);
          },
          error => {
            console.error('Error during document upload:', error);
          }
        );
      });
    } else {
      //console.log('Please select at least one file to upload.');
    }
  }
}