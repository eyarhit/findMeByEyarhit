import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { getDefaultHomeUrl } from '../../shared/constants/notification-navigation';

/** Redirection `/` selon le rôle (évite d'envoyer tout le monde vers `/cv`). */
@Component({
  selector: 'app-home-redirect',
  template: `
    <div class="home-redirect-loading">
      <p>Chargement FindMe…</p>
    </div>
  `,
  styles: [
    `
      .home-redirect-loading {
        min-height: 40vh;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        font-family: Roboto, sans-serif;
      }
    `,
  ],
})
export class HomeRedirectComponent implements OnInit {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const url = this.authService.isAuthenticated()
      ? getDefaultHomeUrl(this.authService.getRole())
      : '/acceuil-find-me';
    this.router.navigateByUrl(url, { replaceUrl: true });
  }
}
