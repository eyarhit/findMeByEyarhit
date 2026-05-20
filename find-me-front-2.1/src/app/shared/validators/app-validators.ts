import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const PERSON_NAME_PATTERN = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'\-]{1,48}$/;
const PHONE_PATTERN = /^(\+216[259]\d{7}|\+33[1-9]\d{8}|[259]\d{7}|0[1-9]\d{8})$/;
const LINKEDIN_PATTERN = /^(https?:\/\/)?(www\.)?linkedin\.com\/.+/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export class AppValidators {
  static personName: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const err = AppValidators.validatePersonName(control.value);
    return err ? { personName: { message: err } } : null;
  };

  static phone: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const err = AppValidators.validatePhone(control.value, false);
    return err ? { phone: { message: err } } : null;
  };

  static phoneOptional: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const err = AppValidators.validatePhone(control.value, true);
    return err ? { phone: { message: err } } : null;
  };

  static email: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const err = AppValidators.validateEmail(control.value, false);
    return err ? { email: { message: err } } : null;
  };

  static linkedinOptional: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const err = AppValidators.validateLinkedIn(control.value);
    return err ? { linkedin: { message: err } } : null;
  };

  static birthDate: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const err = AppValidators.validateBirthDate(control.value, false);
    return err ? { birthDate: { message: err } } : null;
  };

  static birthDateOptional: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const err = AppValidators.validateBirthDate(control.value, true);
    return err ? { birthDate: { message: err } } : null;
  };

  static genderRequired: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const err = AppValidators.validateGender(control.value);
    return err ? { gender: { message: err } } : null;
  };

  static validatePersonName(value: unknown): string | null {
    if (value == null || String(value).trim() === '') {
      return 'Le nom est obligatoire (2 à 50 caractères, lettres uniquement).';
    }
    const v = String(value).trim();
    if (!PERSON_NAME_PATTERN.test(v)) {
      return 'Caractères invalides : utilisez uniquement des lettres, espaces, tirets ou apostrophes.';
    }
    return null;
  }

  static validatePhone(value: unknown, optional = false): string | null {
    if (value == null || String(value).trim() === '' || value === 'Non spécifié') {
      return optional ? null : 'Le numéro de téléphone est obligatoire.';
    }
    const cleaned = String(value).replace(/[\s.\-()]/g, '');
    if (!PHONE_PATTERN.test(cleaned)) {
      return 'Numéro invalide (ex. +216XXXXXXXX ou +33XXXXXXXXX).';
    }
    return null;
  }

  static validateEmail(value: unknown, optional = false): string | null {
    if (value == null || String(value).trim() === '' || value === 'Non spécifié') {
      return optional ? null : "L'adresse e-mail est obligatoire.";
    }
    const v = String(value).trim();
    if (!EMAIL_PATTERN.test(v)) {
      return 'Adresse e-mail invalide.';
    }
    return null;
  }

  static validateLinkedIn(value: unknown): string | null {
    if (
      value == null ||
      String(value).trim() === '' ||
      value === 'Entrer lien de LinkedIn'
    ) {
      return null;
    }
    const v = String(value).trim();
    if (!LINKEDIN_PATTERN.test(v)) {
      return 'URL LinkedIn invalide (ex. https://linkedin.com/in/votre-profil).';
    }
    return null;
  }

  static validateBirthDate(value: unknown, optional = false): string | null {
    if (value == null || String(value).trim() === '') {
      return optional ? null : 'La date de naissance est obligatoire.';
    }
    const v = String(value).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return 'Date invalide.';
    }
    const date = new Date(v + 'T12:00:00');
    if (isNaN(date.getTime())) {
      return 'Date invalide.';
    }
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    if (date > today) {
      return 'La date de naissance ne peut pas être dans le futur.';
    }
    const min = new Date();
    min.setFullYear(min.getFullYear() - 100);
    if (date < min) {
      return 'Date de naissance trop ancienne.';
    }
    const adult = new Date();
    adult.setFullYear(adult.getFullYear() - 16);
    if (date > adult) {
      return 'Vous devez avoir au moins 16 ans.';
    }
    return null;
  }

  static validateGender(value: unknown): string | null {
    if (value == null || String(value).trim() === '') {
      return 'Veuillez sélectionner un genre.';
    }
    return null;
  }

  static validateAddress(value: unknown, optional = true): string | null {
    if (value == null || String(value).trim() === '' || value === 'Non spécifié') {
      return optional ? null : "L'adresse est obligatoire.";
    }
    if (String(value).trim().length < 3) {
      return 'Adresse trop courte (3 caractères minimum).';
    }
    if (String(value).length > 200) {
      return 'Adresse trop longue (200 caractères maximum).';
    }
    return null;
  }
}
