import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ApiRoutingServiceUser } from '../../services/api-routing-user.service';

@Component({
  selector: 'app-mot-de-passe-oublier',
  templateUrl: './mot-de-passe-oublier.component.html',
  styleUrls: ['./mot-de-passe-oublier.component.scss']
})
export class MotDePasseOublierComponent {
  showPopup = false;
  showTempMessage = false;
  showHint = false;
  forgotPasswordForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email,
      this.validateEmailFormat
    ])
  });

  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private apiRoutingService: ApiRoutingServiceUser) { }

  validateEmailFormat(control: FormControl): { [key: string]: boolean } | null {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(control.value)) {
      return { 'invalidEmailFormat': true };
    }
    return null;
  }

  showEmailHint() {
    if (!this.forgotPasswordForm.get('email')?.valid) {
      this.showHint = true;
    }
  }

  hideEmailHint() {
    this.showHint = false;
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      const email = this.forgotPasswordForm.get('email')?.value?.toLowerCase() ?? '';
      this.showTempMessage = true;
      this.apiRoutingService.requestApi('/forgot-password', { email }).subscribe(
        response => {
          this.errorMessage = null;
          setTimeout(() => {
            this.showTempMessage = false;
            this.openPopup();
          }, 2000);
        },
        error => {
          this.errorMessage = this.getErrorMessage(error.status);
          this.showTempMessage = false;
        }
      );
    }
  }

  private getErrorMessage(status: number): string {
    switch (status) {
      case 404:
        return "Aucun compte associé à cet email";
      case 500:
        return "Erreur serveur - Veuillez réessayer plus tard";
      default:
        return "Une erreur inattendue est survenue";
    }
  }

  openPopup() {
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
  }
}
