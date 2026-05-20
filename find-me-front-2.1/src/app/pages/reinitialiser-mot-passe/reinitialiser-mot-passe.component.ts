import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';

import { ActivatedRoute } from '@angular/router';
import { ApiRoutingServiceUser } from '../../services/api-routing-user.service';

@Component({
  selector: 'app-reinitialiser-mot-passe',
  templateUrl: './reinitialiser-mot-passe.component.html',
  styleUrls: ['./reinitialiser-mot-passe.component.scss']
})
export class ReinitialiserMotPasseComponent implements OnInit {
  resetPasswordForm: FormGroup;
  passwordVisible = false;
  confirmPasswordVisible = false;
  token: string;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  showPopup = false;

  constructor(private fb: FormBuilder, private apiRoutingService: ApiRoutingServiceUser, private route: ActivatedRoute) {
    this.token = this.route.snapshot.queryParams['token'];
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
  }

  // Custom validator pour vérifier si les mots de passe correspondent
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      control.get('confirmPassword')!.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true }; // Retourne un objet d'erreurs
    } else {
      control.get('confirmPassword')!.setErrors(null);
      return null; // Retourne null si valide
    }
  }

  onSubmit() {

    if (this.resetPasswordForm.valid) {
      //console.log('Formulaire valide, envoi des données...');
      const password = this.resetPasswordForm.get('password')!.value;
      const confirmPassword = this.resetPasswordForm.get('confirmPassword')!.value;
      const body = {
        password,
        confirmPassword,
        token: this.token
      };
      this.apiRoutingService.requestApi('/reset-password', body).subscribe(
        response => {
          //console.log('Password reset response:', response);
          this.openPopup();
          this.errorMessage = null;
        },
        error => {
          console.error('Error resetting password:', error);
          this.errorMessage = 'Lien expiré. ';
          this.successMessage = null;
        }
      );
    } else {
      //console.log('Formulaire invalide');
      Object.keys(this.resetPasswordForm.controls).forEach(key => {
        this.resetPasswordForm.get(key)!.markAsTouched();
      });
    }
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }
  openPopup() {
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
  }
}
