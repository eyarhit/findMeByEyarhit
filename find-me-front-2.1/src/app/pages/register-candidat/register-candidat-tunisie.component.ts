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
  selector: 'app-register-candidat-tunisie',
  templateUrl: './register-candidat-tunisie.component.html',
  styleUrls: ['./register-candidat-tunisie.component.scss']
})
export class RegisterCandidatTunisieComponent implements OnInit {
  /**
   * Si false : pas de toggle « Identification de métier », pas de quiz à l'inscription.
   * Passer à true pour réactiver le flux quiz / vérification métier.
   */
  readonly requireMetierIdentificationQuiz = false;

  questions: any[] = [];
  isSuccess = false;
  currentPage = 1;
  startDate = new Date();
  startTime = this.startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  isPopupVisible = false;
  isEchecPopupQuizVisible = false;
  showHint = false;
  showPasswordHint = false;
  invalidCharEntered = false;
  isQuizPassed = false;
  isCarteSejour =false;
  quizResponses: { [key: string]: string } = {};
  isQuizVisible = false;
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
  isLoading: boolean = false;
  isLoadingVerification: boolean = false;
  phoneCode: boolean=false;
  files: File[] = [];
  fileName: string = '';
  errorcreation: boolean=false


  otp1: string = '';
  otp2: string = '';
  otp3: string = '';
  otp4: string = '';
  otp5: string = '';
  otp6: string = '';

  isChoixMetierVisible = false;
  isToggleChecked = false;

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
      targetmarket: [''],
      residenceType:[''],
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

  ngOnInit(): void {
    this.startDate = new Date();
    this.startTime = this.startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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

  onSubmit() {
    this.isLoadingVerification=true;
    const metierOk = !this.requireMetierIdentificationQuiz || this.isToggleChecked;
    if (this.registerFormTunisie.valid && this.otpString && metierOk) {
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
            targetmarket:this.targetmarket,
            address: '',
            dateOfBirth: '',
            sexe: '',
            nomSociete: '',
            id_societer:null,
            id_responsable:null,
            linkedinUrl: '',
            role: 'CANDIDAT'
        };
        //console.log(registrationDTO);
        //console.log(this.otpString);
        const params = new HttpParams().set('otp', this.otpString);

        this.apiRoutingServiceUser.requestApi('/register', registrationDTO, params)
            .subscribe({
                next: (response) => {
                    //console.log('Registration successful:', response);
                    this.isLoadingVerification=false;
                    this.openSuccessPopup();
                    //console.log("email checking",registrationDTO.email)
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
  this.errorcreation=false;
  if(!((((this.country !== 'Tunisie' || this.targetmarket !== 'Francais') || (this.ResidenceTypeValid && this.files.length!=0)) && this.registerFormTunisie.valid))){
    this.errorcreation=true;
  }
  else if(((this.country !== 'Tunisie' || this.targetmarket !== 'Francais') || (this.ResidenceTypeValid && this.files.length!=0))&& this.registerFormTunisie.valid){
    this.errorcreation=false;
    if (!this.requireMetierIdentificationQuiz) {
      this.openPopup();
    } else if (this.isSuccess) {
      this.openPopup();
    }
  }
}

  openPopup() {
    this.email = this.registerFormTunisie.get('email')?.value.toLowerCase();
    //console.log(this.email);
    this.emailErrorMessage='';
    this.isLoading = true;
    this.sendOTP(this.email);
  }

  sendOTP(email: string) {
    const params = new HttpParams().set('email', email);
    //console.log(email)
    this.apiRoutingServiceUser.requestApi('/generate',params).subscribe({
      next: (response: any) => {
        //console.log('OTP sent successfully:', response);
        
        this.isLoading = false;
        this.showPopup = true;
      },
      error: (error: any) => {
        console.error('Error sending OTP:', error);
        if (error.status === 400) {
          this.isLoading=false
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

  closePopup() {
    this.closePopupQuiz();
    this.isQuizVisible = false;

    const toggleSwitch = document.getElementById('toggleSwitch') as HTMLInputElement;

    if (toggleSwitch) {
      toggleSwitch.checked = true;
      toggleSwitch.dispatchEvent(new Event('change'));
    }
    this.isToggleChecked = true;
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

  goToPage(pageNumber: number): void {
    this.currentPage = pageNumber;
  }

  showPopupQuiz(): void {
    if (!this.requireMetierIdentificationQuiz) {
      return;
    }
    this.isSuccess = this.checkIfQuizIsSuccess();
    if (this.isSuccess) {
      this.isPopupVisible = true;
    } else {
      this.isEchecPopupQuizVisible = true;
    }
  }

checkIfQuizIsSuccess(): boolean {
    let correctCount = 0;
    for (const question of this.questions) {
        if (this.quizResponses[question.id] === question.correctAnswer) {
            correctCount++;
        }
    }
    const successThreshold = Math.ceil(this.questions.length * (2 / 3)); // Calculate 2/3 threshold
    return correctCount >= successThreshold; // Return true if correct count meets or exceeds the threshold
}
  closePopupQuiz(): void {
    this.isPopupVisible = false;
    this.CloseChoixMetier();
  }
OpenQuiz() {
  if (!this.requireMetierIdentificationQuiz) {
    return;
  }
  const TypeMetier = this.metierSelect.nativeElement.value;
  const params = new HttpParams().set('type', TypeMetier);

  this.apiRoutingServiceQuiz.requestApiGet('/api/v1/quiz/questions', params).subscribe(
    (response: any) => {
      try {
        const allQuestions = JSON.parse(response);
        
        // Validate response format
        if (!Array.isArray(allQuestions)) {
          throw new Error('Invalid questions format');
        }

        // Process questions
        const uniqueQuestions = this.removeDuplicates(allQuestions);
        const selectedQuestions = this.selectRandomQuestions(uniqueQuestions, 3);

        this.questions = selectedQuestions;
        this.isQuizVisible = true;

        //console.log('Processed questions:', {
        //   originalCount: allQuestions.length,
        //   uniqueCount: uniqueQuestions.length,
        //   selectedCount: selectedQuestions.length,
        //   selectedQuestions: this.questions
        // });

      } catch (error) {
        console.error('Error processing questions:', error);
      }
    },
    (error) => {
      console.error('Error fetching quiz questions:', error);
    }
  );
}

// Utility functions
private removeDuplicates(questions: any[]): any[] {
  const uniqueMap = new Map();
  questions.forEach(question => {
    if (question?.id) {  // Assuming questions have unique IDs
      uniqueMap.set(question.id, question);
    }
  });
  return Array.from(uniqueMap.values());
}

private selectRandomQuestions(questions: any[], count: number): any[] {
  if (questions.length <= count) return [...questions];
  
  // Fisher-Yates shuffle algorithm
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

  OpenChoixMetier() {
    this.isChoixMetierVisible = true;
  }

  CloseChoixMetier() {
    this.isChoixMetierVisible = false;
  }


  toggleSwitchChanged(event: any) {
    if (!this.requireMetierIdentificationQuiz) {
      return;
    }
    this.isToggleChecked = event.target.checked;
    if (event.target.checked) {
        this.OpenChoixMetier();
    }
}

  CloseQuiz() {
    this.isToggleChecked=false; 
    const toggleSwitch = document.getElementById('toggleSwitch') as HTMLInputElement | null;
    if (toggleSwitch) {
      toggleSwitch.checked = false;
    }
    this.isQuizVisible = false;
    this.CloseChoixMetier();
  }

  CloseEchecPopup() {
    this.isEchecPopupQuizVisible = false;
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
      this.targetmarket=targetmarket;
      if (this.country === 'Tunisie' && targetmarket === 'Francais') {
        this.phoneCode = true;
        this.num = '+33'; // Default value in dropdown

      } else {
        this.files=[]
        this.registerFormTunisie.get('residenceType')?.setValue('')
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
      //console.log(this.targetmarket)
    }
  }
  
  onPhoneCodeChange(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.num = selectedValue; // Update `num` with selected dropdown value
    //console.log('Selected phone code from dropdown:', this.num);
  }
  
  //Upload document séjour
  openPopupCarteSejour(){
    this.isCarteSejour=true;
  }
  closePopupCarteSejour(){
    this.isCarteSejour=false;
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
    // Append new files, avoid duplicates if needed
    this.files = [...this.files, ...newFiles];

  }
  
  handleFileRemoved(index: number): void {
    this.files.splice(index, 1);
    // Trigger change detection if needed
    this.files = [...this.files];
  }
  onUpload(email:string): void {
    // Prepare all files to upload
    if (this.files.length > 0) {
      const allFiles = [...this.files];
      
      allFiles.forEach(file => {
        const fileName = this.fileName ? this.fileName : file.name;  // Use the provided file name or the original one
        this.documentService.uploadDocument(file, fileName,"Type_Sejour",email).subscribe(
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
