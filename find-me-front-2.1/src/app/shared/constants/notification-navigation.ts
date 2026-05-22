import { isRecruiterRole } from './role-utils';

export interface NotificationTarget {
  targetRoute?: string | null;
  targetId?: number | null;
  targetType?: string | null;
}

/** Page d'accueil métier par rôle (pas l'accueil CV `/cv/accueil`). */
export function getDefaultHomeUrl(role: string | null | undefined): string {
  switch (role) {
    case 'CANDIDAT':
      return '/Offres/Liste';
    case 'FREELANCER':
    case 'PORTAGE_SALARIAL':
      return '/Missions/Liste';
    case 'ESN_ADMIN':
    case 'CHARGEDERECRUTEMENT':
      return '/Offres/publier';
    case 'ESN_COMMERCIAL':
      return '/gestion-employer/esn-commercial';
    case 'ADMIN':
      return '/utilisateur/bi/executive';
    default:
      return '/acceuil-find-me';
  }
}

function normalizePath(route: string): string {
  const trimmed = route.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/** Pages d'accueil génériques — pas une cible de clic sur une notif métier. */
export function isNonBusinessHomePath(path: string): boolean {
  const p = normalizePath(path);
  if (!p || p === '/') {
    return true;
  }
  if (p === '/acceuil-find-me' || p === '/cv' || p.startsWith('/cv/accueil')) {
    return true;
  }
  if (p === '/Offres/Liste' || p === '/Missions/Liste' || p === '/Offres/publier' || p === '/Missions/publier') {
    return true;
  }
  if (p === '/utilisateur/accueil' || p.startsWith('/gestion-employer')) {
    return true;
  }
  return false;
}

function isMissionLike(route: string, targetType?: string | null): boolean {
  const t = (targetType || '').toUpperCase();
  if (t === 'OFFRE' || t === 'JOB' || t === 'EMPLOI') {
    return false;
  }
  if (t === 'MISSION') {
    return !/offre/i.test(route);
  }
  if (/offre/i.test(route) && !/mission/i.test(route)) {
    return false;
  }
  return /mission/i.test(route);
}

/** URL de détail offre/mission selon le rôle connecté. */
export function buildMissionDetailUrl(
  role: string | null | undefined,
  missionId: number,
  targetType?: string | null,
  preferPublishView = false
): string {
  const id = String(missionId);
  const missionLike = isMissionLike('', targetType);

  if (role === 'CANDIDAT') {
    return `/OffreDetails/${id}`;
  }
  if (role === 'FREELANCER' || role === 'PORTAGE_SALARIAL') {
    return `/MissionDetails/${id}`;
  }
  if (isRecruiterRole(role)) {
    if (preferPublishView) {
      return missionLike ? `/MissionPublierDetails/${id}` : `/OffrePublierDetails/${id}`;
    }
    return missionLike ? `/MissionPublierDetails/${id}` : `/OffreConsultation/${id}`;
  }
  return `/OffreDetails/${id}`;
}

/** Adapte une route stockée en base (parfois créée pour un autre rôle). */
export function remapRouteForRole(route: string, role: string | null | undefined): string {
  let path = normalizePath(route);
  if (!path || path === '/') {
    return '';
  }

  // L'espace CV n'est pas une cible de notification (nouvelle offre / mission)
  if (path === '/cv' || path.startsWith('/cv/')) {
    return '';
  }
  if (path === '/acceuil-find-me') {
    return '';
  }

  const idMatch = path.match(/(\d+)\s*$/);
  const id = idMatch ? idMatch[1] : null;

  if (role === 'CANDIDAT') {
    if (path.includes('MissionDetails') && id) {
      return `/OffreDetails/${id}`;
    }
    if (path.includes('MissionPublierDetails') && id) {
      return `/OffreDetails/${id}`;
    }
    if (path.includes('OffreConsultation') && id) {
      return `/OffreDetails/${id}`;
    }
    if (path.includes('OffrePublierDetails') && id) {
      return `/OffreDetails/${id}`;
    }
  }

  if (role === 'FREELANCER' || role === 'PORTAGE_SALARIAL') {
    if (path.includes('OffreDetails') && id) {
      return `/MissionDetails/${id}`;
    }
    if (path.includes('OffreConsultation') && id) {
      return `/MissionDetails/${id}`;
    }
    if (path.includes('OffrePublierDetails') && id) {
      return `/MissionDetails/${id}`;
    }
    if (path.includes('MissionPublierDetails') && id) {
      return `/MissionDetails/${id}`;
    }
  }

  if (isRecruiterRole(role) && id) {
    if (path.includes('OffreDetails')) {
      return `/OffreConsultation/${id}`;
    }
    if (path.includes('MissionDetails')) {
      return `/MissionPublierDetails/${id}`;
    }
    if (path.includes('OffreDetails') || path.includes('MissionDetails')) {
      return path
        .replace('OffreDetails', 'OffreConsultation')
        .replace('MissionDetails', 'MissionPublierDetails');
    }
  }

  return path;
}

/** Route finale au clic sur une notification (détail offre/mission, jamais accueil CV public). */
export function resolveNotificationUrl(
  role: string | null | undefined,
  notification: NotificationTarget
): string | null {
  const id =
    notification.targetId != null && !Number.isNaN(Number(notification.targetId))
      ? Number(notification.targetId)
      : null;

  if (notification.targetRoute) {
    const mapped = remapRouteForRole(notification.targetRoute, role);
    if (mapped && !isNonBusinessHomePath(mapped)) {
      return mapped;
    }
  }

  if (id != null && id > 0) {
    return buildMissionDetailUrl(
      role,
      id,
      notification.targetType,
      isRecruiterRole(role)
    );
  }

  return null;
}
