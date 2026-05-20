import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

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

export const AdminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const decoded: any = jwtDecode(token);
    const role =
      normalizeRole(decoded?.role) ??
      normalizeRole(decoded?.Role) ??
      normalizeRole(decoded?.userRole) ??
      normalizeRole(decoded?.roles);

    if (role === 'ADMIN') {
      return true;
    }
  } catch (error) {
    router.navigate(['/login']);
    return false;
  }

  router.navigate(['/login']);
  return false;
};
