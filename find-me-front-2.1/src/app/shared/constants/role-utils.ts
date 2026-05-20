/** Rôles ESN / recrutement (ne postulent pas aux offres). */
export const RECRUITER_ROLES = [
  'ESN_ADMIN',
  'ESN_COMMERCIAL',
  'CHARGEDERECRUTEMENT',
] as const;

export function isRecruiterRole(role: string | null | undefined): boolean {
  if (!role) {
    return false;
  }
  return (RECRUITER_ROLES as readonly string[]).includes(role);
}

export function canApplyToJobOffer(role: string | null | undefined): boolean {
  return role === 'CANDIDAT';
}

export function canApplyToMission(role: string | null | undefined): boolean {
  return role === 'FREELANCER' || role === 'PORTAGE_SALARIAL';
}

/** Espace mission-details pour la liste offres selon le rôle. */
export function offerListDetailEspace(role: string | null | undefined): string {
  return isRecruiterRole(role) ? 'Consultation Offre' : 'Postuler Offre';
}
