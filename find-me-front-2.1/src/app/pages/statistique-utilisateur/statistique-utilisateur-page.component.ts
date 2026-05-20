import { Component, OnInit } from '@angular/core';
import { ApiRoutingServiceUser } from '../../services/api-routing-user.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-statistique-utilisateur-page',
  templateUrl: './statistique-utilisateur-page.component.html',
  styleUrls: ['./statistique-utilisateur-page.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('stagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger('100ms', [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('chartGrow', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', 
          style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ]
})
export class StatistiqueUtilisateurPageComponent implements OnInit {
  users: any[] = [];
  isLoading = false;
  roleCounts: { [key: string]: number } = {};
  statusCounts: { [key: string]: number } = {};
  totalUsers = 0;
  totalStatus = 0;

  constructor(private apiRoutingServiceUser: ApiRoutingServiceUser) {}

  ngOnInit(): void {
    this.fetchUsersByRoles(['ADMIN', 'ENTREPRISE', 'CANDIDAT']);
  }

  fetchUsersByRoles(roles: string[]): void {
    this.isLoading = true;
    let pendingRequests = roles.length;

    roles.forEach(role => {
      this.apiRoutingServiceUser.requestGetApi(`/role/${role}`).subscribe({
        next: (response) => {
          const users = response.map((user: any) => ({
            id: user.userId,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            phone: user.phone,
            imageProfile: user.presignedUrl,
            role,
            status: user.status
          }));
          this.users.push(...users);
          this.roleCounts[role] = users.length;

          // Count statuses
          users.forEach((u: { status: string | number; }) => {
            this.statusCounts[u.status] = (this.statusCounts[u.status] || 0) + 1;
          });
        },
        error: () => {
          this.roleCounts[role] = 0;
        },
        complete: () => {
          pendingRequests--;
          if (pendingRequests === 0) {
            this.totalUsers = Object.values(this.roleCounts).reduce((a, b) => a + b, 0);
            this.totalStatus = Object.values(this.statusCounts).reduce((a, b) => a + b, 0);
            this.isLoading = false;
          }
        }
      });
    });
  }

  getConicGradient(data: { [key: string]: number }, colors: string[]): string {
    const entries = Object.entries(data);
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) return 'conic-gradient(#f0f0f0 100%)';
    
    let gradient = '';
    let currentPercent = 0;

    entries.forEach(([key, value], index) => {
      const percent = (value / total) * 100;
      gradient += `${colors[index % colors.length]} ${currentPercent}% ${currentPercent + percent}%, `;
      currentPercent += percent;
    });

    return `conic-gradient(${gradient.slice(0, -2)})`;
  }

  getRoleLegendColor(role: string): string {
    const colors: { [key: string]: string } = {
      ADMIN: '#7c3aed',
      ENTREPRISE: '#10b981',
      CANDIDAT: '#f59e0b'
    };
    return colors[role] || '#d1d5db';
  }

  getStatusLegendColor(status: string): string {
    const colors: { [key: string]: string } = {
      ACTIVE: '#10b981',
      INACTIVE: '#ef4444',
      BANNED: '#8b5cf6',
      PENDING: '#f59e0b'
    };
    return colors[status] || '#9ca3af';
  }
}