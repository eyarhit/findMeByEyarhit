export function candidatureStatusLabel(status: string): string {
  switch ((status || '').toUpperCase()) {
    case 'ACCEPTER':
      return 'acceptée';
    case 'REFUSER':
      return 'refusée';
    case 'ENCOURS':
      return 'en cours';
    default:
      return 'en cours';
  }
}

export function offerKindLabel(typeContrat?: string, targetType?: string): string {
  const offreTypes = ['CDI', 'CDD', 'ALTERNANCE'];
  if (targetType === 'OFFRE' || offreTypes.includes(String(typeContrat || '').toUpperCase())) {
    return "l'offre";
  }
  return 'la mission';
}

export function buildNewApplicationMessage(opts: {
  candidateName: string;
  missionName: string;
  referenceCode?: string;
  typeContrat?: string;
  targetType?: string;
}): string {
  const kind = offerKindLabel(opts.typeContrat, opts.targetType);
  const ref = opts.referenceCode ? ` — Réf. ${opts.referenceCode}` : '';
  const name = opts.candidateName?.trim() || 'Un candidat';
  const title = opts.missionName?.trim() || 'Sans titre';
  return `Nouvelle candidature : ${name} a postulé à ${kind} « ${title} »${ref}. Statut : En cours.`;
}

export function buildCandidatureStatusUpdateMessage(opts: {
  missionName: string;
  status: string;
  referenceCode?: string;
  typeContrat?: string;
}): string {
  const kind = offerKindLabel(opts.typeContrat);
  const ref = opts.referenceCode ? ` (réf. ${opts.referenceCode})` : '';
  const title = opts.missionName?.trim() || 'Sans titre';
  const statusText = candidatureStatusLabel(opts.status);
  return `Votre candidature pour ${kind} « ${title} »${ref} est ${statusText}.`;
}

export function buildNewPublishedMissionMessage(opts: {
  missionName: string;
  referenceCode?: string;
  typeContrat?: string;
}): string {
  const kind = offerKindLabel(opts.typeContrat);
  const ref = opts.referenceCode ? ` — Réf. ${opts.referenceCode}` : '';
  const title = opts.missionName?.trim() || 'Sans titre';
  return `Nouvelle annonce : ${kind} « ${title} »${ref} est disponible.`;
}

export function resolveCandidatureTarget(
  missionId: number,
  typeContrat?: string
): { targetRoute: string; targetType: 'OFFRE' | 'MISSION' } {
  const offreTypes = ['CDI', 'CDD', 'ALTERNANCE'];
  const isOffre = offreTypes.includes(String(typeContrat || '').toUpperCase());
  return {
    targetRoute: isOffre ? `/OffreDetails/${missionId}` : `/MissionDetails/${missionId}`,
    targetType: isOffre ? 'OFFRE' : 'MISSION',
  };
}

export function resolveOwnerCandidatureListTarget(
  missionId: number,
  typeContrat?: string
): { targetRoute: string; targetType: 'OFFRE' | 'MISSION' } {
  const offreTypes = ['CDI', 'CDD', 'ALTERNANCE'];
  const isOffre = offreTypes.includes(String(typeContrat || '').toUpperCase());
  return {
    targetRoute: isOffre ? `/Offres/candidatures/${missionId}` : `/Missions/candidatures/${missionId}`,
    targetType: isOffre ? 'OFFRE' : 'MISSION',
  };
}
