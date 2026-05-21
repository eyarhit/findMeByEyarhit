import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';

type HealthState = 'checking' | 'connected' | 'unavailable';

export interface BiManifestCard {
  id: number;
  slug: string;
  title: string;
  domain: string;
  display: string;
  db: string;
  url: string;
}

export interface BiManifestTab {
  key: string;
  label: string;
  cardSlugs: string[];
}

export interface BiManifest {
  version: number;
  generatedAt: string | null;
  metabaseUrl: string;
  dashboard: { id: number | null; name: string; url: string };
  cards: BiManifestCard[];
  tabs: BiManifestTab[];
  credentials?: { metabaseAdminEmail?: string; mysqlReadOnlyUser?: string };
}

@Component({
  selector: 'app-bi-dashboard',
  templateUrl: './bi-dashboard.component.html',
  styleUrls: ['./bi-dashboard.component.scss'],
})
export class BiDashboardComponent implements OnInit, OnDestroy {
  readonly defaultMetabaseUrl = 'http://localhost:3030';

  manifest: BiManifest | null = null;
  manifestError = '';
  selectedTabKey = '';
  showConnectionInfo = false;
  healthState: HealthState = 'checking';
  healthMessage = 'Vérification Metabase…';

  private subscriptions = new Subscription();

  constructor(private http: HttpClient) {}

  get metabaseBaseUrl(): string {
    return this.manifest?.metabaseUrl || this.defaultMetabaseUrl;
  }

  get dashboardId(): number | null {
    return this.manifest?.dashboard?.id ?? null;
  }

  get dashboardAbsoluteUrl(): string {
    if (this.manifest?.dashboard?.url) {
      return this.manifest.dashboard.url;
    }
    if (this.dashboardId != null) {
      return `${this.metabaseBaseUrl}/dashboard/${this.dashboardId}`;
    }
    return this.metabaseBaseUrl;
  }

  get tabs(): BiManifestTab[] {
    return this.manifest?.tabs?.length ? this.manifest.tabs : this.fallbackTabs();
  }

  get selectedTab(): BiManifestTab {
    return this.tabs.find((t) => t.key === this.selectedTabKey) || this.tabs[0];
  }

  get selectedCards(): BiManifestCard[] {
    const slugs = new Set(this.selectedTab?.cardSlugs || []);
    const fromManifest = (this.manifest?.cards || []).filter((c) => slugs.has(c.slug));
    if (fromManifest.length) {
      return fromManifest;
    }
    return (this.manifest?.cards || []).filter((c) => c.domain === this.selectedTabKey);
  }

  get cardCount(): number {
    return this.manifest?.cards?.length ?? 0;
  }

  get isProvisioned(): boolean {
    return !!this.manifest?.cards?.length && this.dashboardId != null;
  }

  ngOnInit(): void {
    this.loadManifest();
    this.probeHealthOnce();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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

  openCard(card: BiManifestCard): void {
    const url = card.url || `${this.metabaseBaseUrl}/question/${card.id}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private loadManifest(): void {
    this.subscriptions.add(
      this.http
        .get<BiManifest>('/assets/bi/bi-manifest.json', { params: { t: Date.now().toString() } })
        .pipe(
          catchError(() => {
            this.manifestError =
              'Manifest BI introuvable. Lancez docker compose (service metabase-seed) pour le générer.';
            return of(null);
          })
        )
        .subscribe((data) => {
          if (!data) {
            return;
          }
          this.manifest = data;
          this.manifestError = '';
          if (!data.cards?.length) {
            this.manifestError =
              'Manifest vide : exécutez « docker compose up » jusqu’à la fin de metabase-seed, ou reset du volume metabase_data.';
          }
          this.selectedTabKey = data.tabs?.[0]?.key || data.cards?.[0]?.domain || '';
        })
    );
  }

  private fallbackTabs(): BiManifestTab[] {
    return [
      { key: 'overview', label: "Vue d'ensemble", cardSlugs: [] },
      { key: 'users', label: 'Utilisateurs', cardSlugs: [] },
      { key: 'missions', label: 'Missions', cardSlugs: [] },
      { key: 'cv', label: 'CV', cardSlugs: [] },
      { key: 'evaluations', label: 'Évaluations', cardSlugs: [] },
    ];
  }

  private probeHealthOnce(): void {
    this.subscriptions.add(
      this.http
        .get<{ status?: string }>(`${this.metabaseBaseUrl}/api/health`)
        .pipe(
          take(1),
          map((body) => (body?.status === 'ok' ? 'ok' : 'unknown')),
          catchError((err: HttpErrorResponse) => {
            if (err.status === 503) {
              return of('initializing' as const);
            }
            return of('unavailable' as const);
          })
        )
        .subscribe((kind) => {
          if (kind === 'ok') {
            this.healthState = 'connected';
            this.healthMessage = 'Metabase disponible';
          } else if (kind === 'initializing') {
            this.healthState = 'checking';
            this.healthMessage = 'Metabase démarre — patientez 1–2 min';
          } else if (kind === 'unknown') {
            this.healthState = 'checking';
            this.healthMessage = 'Metabase répond (statut inattendu)';
          } else {
            this.healthState = 'unavailable';
            this.healthMessage = 'Metabase injoignable sur le port 3030';
          }
        })
    );
  }
}
