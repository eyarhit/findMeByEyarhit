/** Nom d'affichage du CV saisi par le candidat (session + téléchargement). */
export const CV_FILE_NAME_STORAGE_KEY = 'cv_findme_display_name';

export function buildFindMeCvFileName(displayName: string): string {
  const base = String(displayName ?? '').trim() || 'CV';
  return `FIND ME-${base}`.replace(/\s+/g, '.');
}

export function persistCvDisplayName(displayName: string): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  const trimmed = String(displayName ?? '').trim();
  if (trimmed) {
    sessionStorage.setItem(CV_FILE_NAME_STORAGE_KEY, trimmed);
  }
}

export function getSavedCvDisplayName(): string | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  const saved = sessionStorage.getItem(CV_FILE_NAME_STORAGE_KEY);
  return saved?.trim() ? saved.trim() : null;
}

/** Priorité : champ « Nom du cv » → dernier nom sauvegardé → nom utilisateur → « CV ». */
export function resolveCvDisplayName(
  formValue: string | null | undefined,
  fallbackFullName?: string | null
): string {
  const fromForm = String(formValue ?? '').trim();
  if (fromForm) {
    return fromForm;
  }
  const saved = getSavedCvDisplayName();
  if (saved) {
    return saved;
  }
  const fromUser = String(fallbackFullName ?? '').trim();
  if (fromUser) {
    return fromUser;
  }
  return 'CV';
}

/** Ex. « FIND.ME.Mon.CV » → « Mon CV » pour réafficher dans le champ. */
export function displayNameFromStoredFileName(fileName: string): string {
  let name = String(fileName ?? '').trim();
  name = name.replace(/^FIND\s*ME[-\s]*/i, '');
  name = name.replace(/\.pdf$/i, '');
  return name.replace(/\./g, ' ').trim();
}
