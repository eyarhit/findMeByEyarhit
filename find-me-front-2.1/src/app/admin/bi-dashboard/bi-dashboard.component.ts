import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';

type HealthState = 'checking' | 'connected' | 'unavailable';

interface BiTab {
  key: string;
  label: string;
  cardIds: number[];
}

@Component({
  selector: 'app-bi-dashboard',
  templateUrl: './bi-dashboard.component.html',
  styleUrls: ['./bi-dashboard.component.scss'],
})
export class BiDashboardComponent implements OnInit, OnDestroy {
  readonly metabaseBaseUrl =
    (typeof window !== 'undefined' && (window as any).__env?.METABASE_URL) || 'http://localhost:3030';

  readonly connectionInfo = {
    url: this.metabaseBaseUrl,
    accessNote: 'Ouvrez chaque rapport dans Metabase (nouvel onglet). Compte admin Metabase : variables METABASE_SETUP_* dans docker-compose.',
    mysqlUser: 'findme_bi (lecture seule)',
  };

  readonly dashboardId = 2;

  readonly tabs: BiTab[] = [
    { key: 'users', label: 'Utilisateurs', cardIds: [40, 41] },
    { key: 'missions', label: 'Missions & Candidatures', cardIds: [43, 44, 45, 46] },
    { key: 'skills', label: 'Competences', cardIds: [42] },
    { key: 'evaluations', label: 'Evaluations', cardIds: [47, 48, 49, 50] },
    { key: 'kpis', label: 'KPIs Globaux', cardIds: [51] },
  ];

  selectedTabKey = this.tabs[0].key;
  showConnectionInfo = false;
  healthState: HealthState = 'checking';
  healthMessage = 'Verification en cours...';

  private subscriptions = new Subscription();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.probeHealthOnce();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get selectedTab(): BiTab {
    return this.tabs.find((tab) => tab.key === this.selectedTabKey) || this.tabs[0];
  }

  get dashboardAbsoluteUrl(): string {
    return `${this.metabaseBaseUrl}/dashboard/${this.dashboardId}`;
  }

  questionAbsoluteUrl(cardId: number): string {
    return `${this.metabaseBaseUrl}/question/${cardId}`;
  }

  selectTab(tabKey: string): void {
    this.selectedTabKey = tabKey;
  }

  toggleConnectionInfo(): void {
    this.showConnectionInfo = !this.showConnectionInfo;
  }

  openMetabaseHome(): void {
    window.open(this.metabaseBaseUrl, '_blank', 'noopener,noreferrer');
  }

  openDashboard(): void {
    window.open(this.dashboardAbsoluteUrl, '_blank', 'noopener,noreferrer');
  }

  openQuestion(cardId: number): void {
    window.open(this.questionAbsoluteUrl(cardId), '_blank', 'noopener,noreferrer');
  }

  /** Une seule requete health au chargement (pas de polling = moins de bruit console / reseau). */
  private probeHealthOnce(): void {
    this.subscriptions.add(
      this.http
        .get<{ status?: string; progress?: number }>(`${this.metabaseBaseUrl}/api/health`)
        .pipe(
          take(1),
          map((body) => {
            if (body?.status === 'ok') return { kind: 'ok' as const };
            return { kind: 'unknown' as const };
          }),
          catchError((err: HttpErrorResponse) => {
            if (err.status === 503) {
              let b: unknown = err.error;
              if (typeof b === 'string') {
                try {
                  b = JSON.parse(b);
                } catch {
                  /* ignore */
                }
              }
              if (b && typeof b === 'object' && (b as { status?: string }).status === 'initializing') {
                return of({ kind: 'initializing' as const });
              }
            }
            return of({ kind: 'unavailable' as const });
          })
        )
        .subscribe((res) => {
          if (res.kind === 'ok') {
            this.healthState = 'connected';
            this.healthMessage = 'Metabase disponible';
          } else if (res.kind === 'initializing') {
            this.healthState = 'checking';
            this.healthMessage = 'Metabase demarre — reessayez ou ouvrez le port 3030';
          } else if (res.kind === 'unknown') {
            this.healthState = 'checking';
            this.healthMessage = 'Metabase repond (statut inattendu)';
          } else {
            this.healthState = 'unavailable';
            this.healthMessage = 'Metabase injoignable (ouvrez le lien pour verifier)';
          }
        })
    );
  }
}
