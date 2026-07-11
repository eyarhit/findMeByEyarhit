import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const PERSON_NAME_PATTERN = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'\-]{1,48}$/;
const PHONE_PATTERN = /^(\+216[259]\d{7}|\+33[1-9]\d{8}|[259]\d{7}|0[1-9]\d{8})$/;
const LINKEDIN_PATTERN = /^(https?:\/\/)?(www\.)?linkedin\.com\/.+/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{4,}$/;
const ADMIN_ROLES = ['CANDIDAT', 'ESN_ADMIN', 'ADMIN'] as const;
const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'PENDING'] as const;

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

  static passwordOptional: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const err = AppValidators.validatePasswordOptional(control.value);
    return err ? { password: { message: err } } : null;
  };

  static adminRole: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const err = AppValidators.validateAdminRole(control.value);
    return err ? { adminRole: { message: err } } : null;
  };

  static userStatus: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const err = AppValidators.validateUserStatus(control.value);
    return err ? { userStatus: { message: err } } : null;
  };

  static companyNameOptional: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const err = AppValidators.validateCompanyName(control.value);
    return err ? { companyName: { message: err } } : null;
  };

  static countryOptional: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const err = AppValidators.validateCountry(control.value);
    return err ? { country: { message: err } } : null;
  };

  static validatePasswordOptional(value: unknown): string | null {
    if (value == null || String(value).trim() === '') {
      return null;
    }
    if (!PASSWORD_PATTERN.test(String(value))) {
      return 'Mot de passe invalide : au moins 4 caractères, une majuscule, une minuscule et un chiffre.';
    }
    return null;
  }

  static validateAdminRole(value: unknown): string | null {
    if (value == null || String(value).trim() === '') {
      return 'Le rôle est obligatoire.';
    }
    if (!ADMIN_ROLES.includes(String(value).trim().toUpperCase() as (typeof ADMIN_ROLES)[number])) {
      return 'Rôle invalide (Candidat, RH ou Admin).';
    }
    return null;
  }

  static validateUserStatus(value: unknown): string | null {
    if (value == null || String(value).trim() === '') {
      return 'Le statut est obligatoire.';
    }
    if (!USER_STATUSES.includes(String(value).trim().toUpperCase() as (typeof USER_STATUSES)[number])) {
      return 'Statut invalide.';
    }
    return null;
  }

  static validateCompanyName(value: unknown): string | null {
    if (value == null || String(value).trim() === '') {
      return null;
    }
    if (String(value).trim().length > 100) {
      return 'Nom de société trop long (100 caractères maximum).';
    }
    return null;
  }

  static validateCountry(value: unknown): string | null {
    if (value == null || String(value).trim() === '') {
      return null;
    }
    if (String(value).trim().length > 80) {
      return 'Pays trop long (80 caractères maximum).';
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

  /** Nom de département, poste, compétence, etc. */
  static missionLabel: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const err = AppValidators.validateMissionLabel(control.value);
    return err ? { missionLabel: { message: err } } : null;
  };

  /** Description, avantages, exigences — texte significatif */
  static meaningfulText(minLength = 10): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const err = AppValidators.validateMeaningfulText(control.value, minLength);
      return err ? { meaningfulText: { message: err } } : null;
    };
  }

  /** Date de début d'offre : aujourd'hui ou futur proche */
  static missionStartDate: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const err = AppValidators.validateMissionStartDate(control.value);
    return err ? { missionStartDate: { message: err } } : null;
  };

  /** Période cohérente : fin > début, durée max 5 ans */
  static missionDateRange: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const err = AppValidators.validateMissionDateRange(
      group.get('date_debut')?.value,
      group.get('date_fin')?.value
    );
    return err ? { missionDateRange: { message: err } } : null;
  };

  static validateMissionLabel(value: unknown): string | null {
    if (value == null || String(value).trim() === '') {
      return 'Ce champ est obligatoire.';
    }
    const v = String(value).trim();
    if (v.length < 2) {
      return 'Minimum 2 caractères.';
    }
    if (v.length > 100) {
      return 'Maximum 100 caractères.';
    }
    if (!/[A-Za-zÀ-ÿ]/.test(v)) {
      return 'Doit contenir au moins une lettre.';
    }
    if (/^(.)\1+$/.test(v)) {
      return 'Valeur non valide (caractères répétés).';
    }
    if (!/^[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9\s&'.()/\-]*$/.test(v)) {
      return 'Caractères invalides. Utilisez des lettres, chiffres ou espaces.';
    }
    return null;
  }

  static validateMeaningfulText(value: unknown, minLength = 10): string | null {
    if (value == null || String(value).trim() === '') {
      return 'Ce champ est obligatoire.';
    }
    const v = String(value).trim();
    if (v.length < minLength) {
      return `Minimum ${minLength} caractères.`;
    }
    if (v.length > 5000) {
      return 'Texte trop long (5000 caractères maximum).';
    }
    const letterCount = (v.match(/[A-Za-zÀ-ÿ]/g) || []).length;
    if (letterCount < 2) {
      return 'Le texte doit contenir au moins 2 lettres.';
    }
    if (/^[^\wÀ-ÿ\s]+$/.test(v)) {
      return 'Le texte ne peut pas être composé uniquement de symboles.';
    }
    return null;
  }

  static validateMissionStartDate(value: unknown): string | null {
    if (value == null || String(value).trim() === '') {
      return 'La date de début est obligatoire.';
    }
    const v = String(value).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return 'Date invalide.';
    }
    const start = new Date(v + 'T00:00:00');
    if (isNaN(start.getTime())) {
      return 'Date invalide.';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxFuture = new Date(today);
    maxFuture.setFullYear(maxFuture.getFullYear() + 2);
    if (start < today) {
      return 'La date de début ne peut pas être dans le passé.';
    }
    if (start > maxFuture) {
      return 'La date de début ne peut pas dépasser 2 ans dans le futur.';
    }
    return null;
  }

  static validateMissionDateRange(startValue: unknown, endValue: unknown): string | null {
    if (endValue == null || String(endValue).trim() === '') {
      return 'La date de fin est obligatoire.';
    }
    const endStr = String(endValue).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(endStr)) {
      return 'Date de fin invalide.';
    }
    const end = new Date(endStr + 'T00:00:00');
    if (isNaN(end.getTime())) {
      return 'Date de fin invalide.';
    }
    if (startValue == null || String(startValue).trim() === '') {
      return null;
    }
    const startStr = String(startValue).trim();
    const start = new Date(startStr + 'T00:00:00');
    if (isNaN(start.getTime())) {
      return null;
    }
    if (end <= start) {
      return 'La date de fin doit être postérieure à la date de début.';
    }
    const maxEnd = new Date(start);
    maxEnd.setFullYear(maxEnd.getFullYear() + 5);
    if (end > maxEnd) {
      return 'La durée maximale de l\'offre est de 5 ans.';
    }
    return null;
  }

  static validateExperienceYears(value: unknown): string | null {
    if (value == null || value === '') {
      return 'Les années d\'expérience sont obligatoires.';
    }
    const n = Number(value);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      return 'Veuillez saisir un nombre entier.';
    }
    if (n < 0) {
      return 'Les années d\'expérience ne peuvent pas être négatives.';
    }
    if (n > 50) {
      return 'Les années d\'expérience ne peuvent pas dépasser 50.';
    }
    return null;
  }

  static experienceYears: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const err = AppValidators.validateExperienceYears(control.value);
    return err ? { experienceYears: { message: err } } : null;
  };

  static validateSalary(value: unknown): string | null {
    if (value == null || value === '') {
      return 'Le salaire est obligatoire.';
    }
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return 'Veuillez saisir un montant valide.';
    }
    if (n < 100) {
      return 'Le salaire minimum est de 100.';
    }
    if (n > 999999) {
      return 'Le salaire maximum est de 999 999.';
    }
    return null;
  }

  static salary: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const err = AppValidators.validateSalary(control.value);
    return err ? { salary: { message: err } } : null;
  };

  static validatePositionsCount(value: unknown): string | null {
    if (value == null || value === '') {
      return 'Le nombre de postes est obligatoire.';
    }
    const n = Number(value);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      return 'Veuillez saisir un nombre entier.';
    }
    if (n < 1) {
      return 'Au moins 1 poste est requis.';
    }
    if (n > 999) {
      return 'Le nombre de postes ne peut pas dépasser 999.';
    }
    return null;
  }

  static positionsCount: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const err = AppValidators.validatePositionsCount(control.value);
    return err ? { positionsCount: { message: err } } : null;
  };
}
