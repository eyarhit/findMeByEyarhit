import { Component } from '@angular/core';

/** Page BI statique — aucun appel API / Hub / hydratation (évite freeze navigateur). */
@Component({
  selector: 'app-bi-dashboard',
  templateUrl: './bi-dashboard.component.html',
  styleUrls: ['./bi-dashboard.component.scss'],
})
export class BiDashboardComponent {
  readonly pbipPath = 'bi/powerbi/FindMe-Dashboard/FindMe-Dashboard.pbip';
  readonly mysqlDw = 'localhost:3306 · findme_dw · findme_bi';
  readonly hubUrl = 'http://localhost:3032';
  readonly talendUrl = 'http://localhost:6080';

  openPbipHelp(): void {
    window.open(
      'https://github.com/eyarhit/findMeByEyarhit/blob/main/bi/powerbi/README.md',
      '_blank',
      'noopener,noreferrer'
    );
  }

  openHub(): void {
    window.open(this.hubUrl, '_blank', 'noopener,noreferrer');
  }

  openTalend(): void {
    window.open(this.talendUrl, '_blank', 'noopener,noreferrer');
  }
}
