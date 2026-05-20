export interface SelectOption {
  value: string;
  label: string;
}

/** Genres proposés à l'utilisateur (valeur stockée en base). */
export const GENDER_OPTIONS: SelectOption[] = [
  { value: 'Homme', label: 'Homme' },
  { value: 'Femme', label: 'Femme' },
  { value: 'Autre', label: 'Autre' },
  { value: 'Non_specifie', label: 'Préfère ne pas préciser' },
];

export const LANGUAGE_LEVEL_OPTIONS: SelectOption[] = [
  { value: 'Débutant', label: 'Débutant' },
  { value: 'Intermédiaire', label: 'Intermédiaire' },
  { value: 'Avancé', label: 'Avancé' },
  { value: 'Courant', label: 'Courant' },
  { value: 'Langue Maternelle', label: 'Langue maternelle' },
];

export const LANGUAGE_NAME_OPTIONS: SelectOption[] = [
  { value: 'Français', label: 'Français' },
  { value: 'Anglais', label: 'Anglais' },
  { value: 'Allemand', label: 'Allemand' },
  { value: 'Arabe', label: 'Arabe' },
  { value: 'Italien', label: 'Italien' },
  { value: 'Espagnol', label: 'Espagnol' },
];

export function normalizeGender(value: string | null | undefined): string {
  if (value == null || value === '' || value === 'Non spécifié') {
    return '';
  }
  const trimmed = value.trim();
  const match = GENDER_OPTIONS.find(
    (o) => o.value === trimmed || o.label.toLowerCase() === trimmed.toLowerCase()
  );
  return match?.value ?? '';
}

export function genderDisplayLabel(value: string | null | undefined): string {
  if (!value || value === 'Non spécifié') {
    return 'Non spécifié';
  }
  const match = GENDER_OPTIONS.find((o) => o.value === value);
  return match?.label ?? value;
}

export function isAllowedGender(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  return GENDER_OPTIONS.some((o) => o.value === value);
}

const LANGUAGE_LEVEL_ALIASES: Record<string, string> = {
  bilingue: 'Courant',
  fluent: 'Courant',
  couramment: 'Courant',
  professional: 'Avancé',
  professionnel: 'Avancé',
  professionnelle: 'Avancé',
  natif: 'Langue Maternelle',
  native: 'Langue Maternelle',
  maternelle: 'Langue Maternelle',
  'langue maternelle': 'Langue Maternelle',
  debutant: 'Débutant',
  débutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  intermédiaire: 'Intermédiaire',
  avance: 'Avancé',
  avancé: 'Avancé',
};

/** Valeur pour le select langue (tolère imports CV / API). */
export function normalizeLanguageName(value: unknown): string {
  if (value == null || String(value).trim() === '') {
    return '';
  }
  const v = String(value).trim();
  const match = LANGUAGE_NAME_OPTIONS.find(
    (o) =>
      o.value.toLowerCase() === v.toLowerCase() ||
      o.label.toLowerCase() === v.toLowerCase()
  );
  if (match) {
    return match.value;
  }
  if (/fran(c|ç)ais/i.test(v)) {
    return 'Français';
  }
  if (/anglais|english/i.test(v)) {
    return 'Anglais';
  }
  if (/allemand|german/i.test(v)) {
    return 'Allemand';
  }
  if (/arabe|arabic/i.test(v)) {
    return 'Arabe';
  }
  if (/espagnol|spanish/i.test(v)) {
    return 'Espagnol';
  }
  if (/italien|italian/i.test(v)) {
    return 'Italien';
  }
  return v;
}

/** Valeur pour le select niveau (tolère imports CV / API). */
export function normalizeLanguageLevel(value: unknown): string {
  if (value == null || String(value).trim() === '') {
    return '';
  }
  const v = String(value).trim();
  const direct = LANGUAGE_LEVEL_OPTIONS.find(
    (o) =>
      o.value.toLowerCase() === v.toLowerCase() ||
      o.label.toLowerCase() === v.toLowerCase()
  );
  if (direct) {
    return direct.value;
  }
  const alias = LANGUAGE_LEVEL_ALIASES[v.toLowerCase()];
  if (alias) {
    return alias;
  }
  if (/courant|fluent|bilingue/i.test(v)) {
    return 'Courant';
  }
  if (/maternel|native|natif/i.test(v)) {
    return 'Langue Maternelle';
  }
  if (/avanc|advanced/i.test(v)) {
    return 'Avancé';
  }
  if (/interm/i.test(v)) {
    return 'Intermédiaire';
  }
  if (/début|debut|basic/i.test(v)) {
    return 'Débutant';
  }
  return v.length > 40 ? v.slice(0, 40) : v;
}
