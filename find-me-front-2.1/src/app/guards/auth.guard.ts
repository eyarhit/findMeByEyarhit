import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { isPlatformBrowser } from '@angular/common';

function getLocalStorageItem(key: string, platformId: Object): string | null {
  if (isPlatformBrowser(platformId)) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error("Erreur d'accès à localStorage:", error);
    }
  }
  return null;
}

function isExpired(decodedToken: any): boolean {
  const exp = decodedToken?.exp;
  if (typeof exp !== 'number') return false;
  return exp * 1000 <= Date.now();
}

export const AuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return true;
  }
  const token = getLocalStorageItem('token', platformId);

  // console.log('AuthGuard: Vérification de l\'authentification...');

  if (token) {
    try {
      const decodedToken: any = jwtDecode(token);

      if (isExpired(decodedToken)) {
        console.warn("AuthGuard: Token expiré.");
        localStorage.removeItem('token');
        router.navigate(['/login']);
        return false;
      }

      // console.log('✅ AuthGuard: Token valide, accès autorisé.');
      return true;

    } catch (error) {
      // console.error('❌ AuthGuard: Erreur de décodage du token', error);
      router.navigate(['/login']);
      return false;
    }
  } else {
    // console.log('❌ AuthGuard: Pas de token, accès refusé.');
    router.navigate(['/login']);
    return false;
  }
};
