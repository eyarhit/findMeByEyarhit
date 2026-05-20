import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { isPlatformBrowser } from '@angular/common';

function normalizeRole(raw: unknown): string | null {
  if (typeof raw === 'string') {
    const value = raw.trim().replace(/^ROLE_/i, '');
    return value ? value.toUpperCase() : null;
  }
  if (Array.isArray(raw) && raw.length > 0) {
    return normalizeRole(raw[0]);
  }
  return null;
}

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const expectedRoles: string[] = route.data['expectedRole']; // 👈 roles attendus
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const token = localStorage.getItem('token');

  if (!token) {
    // console.warn("❌ RoleGuard: Aucun token trouvé.");
    router.navigate(['/login']);
    return false;
  }

  try {
    const decoded: any = jwtDecode(token);
    const userRole =
      normalizeRole(decoded?.role) ??
      normalizeRole(decoded?.Role) ??
      normalizeRole(decoded?.userRole) ??
      normalizeRole(decoded?.roles);
    const allowedRoles = (expectedRoles || []).map((r) => r.toUpperCase());

    //console.log("🔐 RoleGuard: Rôle extrait du token:", userRole);

    if (userRole && allowedRoles.includes(userRole)) {
      //console.log("✅ RoleGuard: Accès autorisé pour le rôle:", userRole);
      return true;
    } else {
      // console.warn("🚫 RoleGuard: Rôle non autorisé.");
      router.navigate(['/login']);
      return false;
    }
  } catch (error) {
    // console.error("❌ RoleGuard: Erreur lors du décodage du token:", error);
    router.navigate(['/login']);
    return false;
  }
};
