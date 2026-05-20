
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
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

export const AlreadyAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) return true;

  const token = localStorage.getItem('token');

  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      const role =
        normalizeRole(decoded?.role) ??
        normalizeRole(decoded?.Role) ??
        normalizeRole(decoded?.userRole) ??
        normalizeRole(decoded?.roles);
      if (role) {
        //console.log(' AlreadyAuthGuard: utilisateur déjà connecté, redirection...');
        router.navigate(['/acceuil-find-me']); 
        return false;
      }
    } catch (e) {
      return true;
    }
  }

  return true;
};
