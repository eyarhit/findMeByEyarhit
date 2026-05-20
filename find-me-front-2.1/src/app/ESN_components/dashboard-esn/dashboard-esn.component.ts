import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Renderer2, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  trend: number;
  trendDirection: 'up' | 'down';
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface MonthlyData {
  month: string;
  missions: number;
  postulations: number;
}

interface Activity {
  action: string;
  time: string;
  type: string;
}

interface PerformanceMetric {
  label: string;
  value: string;
  icon: string;
  trend: number;
  trendType: 'up' | 'down' | 'neutral';
  type: 'success' | 'excellent' | 'warning' | 'info';
  percentage: number;
  min: string;
  max: string;
}

interface Point {
  x: number;
  y: number;
}

@Component({
  selector: 'app-dashboard-esn',
  templateUrl: './dashboard-esn.component.html',
  styleUrl: './dashboard-esn.component.scss',
  animations: [
    trigger('cardAnimation', [
      transition('* => *', [
        query('.stat-card', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger('100ms', [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class DashboardESNComponent implements OnInit, OnDestroy {
  
  // State management
  selectedPeriod: string = 'today';
  donutViewType: string = 'donut';
  barViewType: string = 'bars';
  activityFilter: string = 'all';
  systemStatus: string = 'En ligne';
  
  // Tooltip properties
  tooltipVisible: boolean = false;
  tooltipX: number = 0;
  tooltipY: number = 0;
  tooltipTitle: string = '';
  tooltipValue: string = '';
  
  // Timer for updates
  private updateTimer: any;
  private isBrowser: boolean;

  // Static data for demonstration
  statCards: StatCard[] = [
    {
      title: 'Missions Publiées',
      value: 245,
      icon: '📋',
      color: 'primary',
      trend: 12.5,
      trendDirection: 'up'
    },
    {
      title: 'Commerciaux Disponibles',
      value: 38,
      icon: '👥',
      color: 'success',
      trend: 8.2,
      trendDirection: 'up'
    },
    {
      title: 'Chargés de Recrutement',
      value: 15,
      icon: '🎯',
      color: 'info',
      trend: 3.1,
      trendDirection: 'down'
    },
    {
      title: 'Inter-Contrats',
      value: 127,
      icon: '📄',
      color: 'warning',
      trend: 15.7,
      trendDirection: 'up'
    },
    {
      title: 'Missions Postulées',
      value: 892,
      icon: '✋',
      color: 'purple',
      trend: 22.4,
      trendDirection: 'up'
    }
  ];

  // Chart data
  missionStatusData: ChartData[] = [
    { name: 'En cours', value: 45, color: '#4F46E5' },
    { name: 'Terminées', value: 32, color: '#10B981' },
    { name: 'En attente', value: 23, color: '#F59E0B' }
  ];

  monthlyData: MonthlyData[] = [
    { month: 'Jan', missions: 20, postulations: 45 },
    { month: 'Fév', missions: 25, postulations: 52 },
    { month: 'Mar', missions: 30, postulations: 61 },
    { month: 'Apr', missions: 28, postulations: 58 },
    { month: 'Mai', missions: 35, postulations: 75 },
    { month: 'Jun', missions: 42, postulations: 89 }
  ];

  recentActivities: Activity[] = [
    { action: 'Nouvelle mission publiée', time: 'Il y a 2 heures', type: 'mission' },
    { action: 'Commercial assigné', time: 'Il y a 3 heures', type: 'commercial' },
    { action: 'Candidature reçue', time: 'Il y a 5 heures', type: 'candidature' },
    { action: 'Mission terminée', time: 'Il y a 1 jour', type: 'mission' },
    { action: 'Nouveau recruteur ajouté', time: 'Il y a 2 jours', type: 'recruteur' },
    { action: 'Contrat signé', time: 'Il y a 3 jours', type: 'commercial' },
    { action: 'Évaluation candidat', time: 'Il y a 4 jours', type: 'candidature' }
  ];

  performanceMetrics: PerformanceMetric[] = [
    {
      label: 'Taux de Conversion',
      value: '73.2%',
      icon: '📈',
      trend: 5.2,
      trendType: 'up',
      type: 'success',
      percentage: 73.2,
      min: '0%',
      max: '100%'
    },
    {
      label: 'Satisfaction Client',
      value: '89.5%',
      icon: '⭐',
      trend: 2.1,
      trendType: 'up',
      type: 'excellent',
      percentage: 89.5,
      min: '0%',
      max: '100%'
    },
    {
      label: 'Temps Moyen de Traitement',
      value: '2.4j',
      icon: '⏱️',
      trend: 0,
      trendType: 'neutral',
      type: 'warning',
      percentage: 60,
      min: '0j',
      max: '4j'
    }
  ];

  // Property to access Math in template
  Math = Math;

  @ViewChild('statsGrid', { static: false }) statsGrid!: ElementRef;
  @ViewChild('tooltip', { static: false }) tooltip!: ElementRef;

  constructor(
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      // Animation d'entrée pour les cartes
      this.animateCards();
      
      // Mise à jour périodique de l'horodatage
      this.startTimestampUpdate();
    }
  }

  ngOnDestroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
  }

  /**
   * Animation d'entrée des cartes statistiques
   */
  animateCards(): void {
    if (!this.isBrowser || !this.statsGrid) return;
    
    setTimeout(() => {
      const cards = this.statsGrid.nativeElement.querySelectorAll('.stat-card');
      cards.forEach((card: HTMLElement, index: number) => {
        setTimeout(() => {
          this.renderer.addClass(card, 'animate-in');
        }, index * 150);
      });
    }, 100);
  }

  /**
   * Calcule la largeur de la barre de progression
   */
  getProgressWidth(value: number, max: number = 100): string {
    return `${Math.min((value / max) * 100, 100)}%`;
  }

  /**
   * Retourne l'icône appropriée selon le type d'activité
   */
  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'mission': '📋',
      'commercial': '👤',
      'candidature': '✋',
      'recruteur': '🎯'
    };
    return icons[type] || '📌';
  }

  /**
   * Retourne la description d'activité
   */
  getActivityDescription(type: string): string {
    const descriptions: { [key: string]: string } = {
      'mission': 'Nouvelle opportunité ajoutée au système',
      'commercial': 'Assignation ou modification d\'un commercial',
      'candidature': 'Nouvelle candidature reçue et traitée',
      'recruteur': 'Modification de l\'équipe de recrutement'
    };
    return descriptions[type] || 'Action effectuée dans le système';
  }

  /**
   * Retourne l'heure actuelle formatée
   */
  getCurrentTime(): string {
    return new Date().toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Met à jour l'horodatage toutes les minutes
   */
  private startTimestampUpdate(): void {
    if (!this.isBrowser) return;
    
    this.updateTimer = setInterval(() => {
      // Force change detection by updating component property
      // This is safer than direct DOM manipulation
      this.refreshTimestamp();
    }, 60000); // Update every minute
  }

  /**
   * Force la mise à jour de l'horodatage
   */
  private refreshTimestamp(): void {
    // Cette méthode peut être étendue pour déclencher une détection de changement
    // si nécessaire avec ChangeDetectorRef
  }

  /**
   * Calcule le total des missions
   */
  getTotalMissions(): number {
    return this.statCards.find(card => card.title === 'Missions Publiées')?.value || 0;
  }

  /**
   * Formate les grands nombres pour l'affichage
   */
  formatLargeNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'k';
    }
    return value.toString();
  }

  /**
   * Calcule le score global
   */
  getOverallScore(): string {
    const avgPercentage = this.performanceMetrics.reduce((sum, metric) => 
      sum + metric.percentage, 0) / this.performanceMetrics.length;
    
    if (avgPercentage >= 80) return 'Excellent';
    if (avgPercentage >= 60) return 'Bon';
    if (avgPercentage >= 40) return 'Moyen';
    return 'À améliorer';
  }

  /**
   * Gère le clic sur les filtres de période
   */
  onPeriodFilterClick(period: string): void {
    this.selectedPeriod = period;
    //console.log(`Filtre période sélectionné: ${period}`);
    // Logique pour filtrer les données selon la période
    this.refreshData();
  }

  /**
   * Gère le changement de vue des graphiques
   */
  onChartViewChange(chartType: string, viewType: string): void {
    if (chartType === 'donut') {
      this.donutViewType = viewType;
    } else if (chartType === 'bar') {
      this.barViewType = viewType;
    }
    //console.log(`Changement de vue: ${chartType} -> ${viewType}`);
  }

  /**
   * Gère le changement de période dans les contrôles
   */
  onTimeRangeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    //console.log(`Période sélectionnée: ${value}`);
    // Logique pour changer la période des données
  }

  /**
   * Gère le filtre des activités
   */
  onActivityFilterClick(filter: string): void {
    this.activityFilter = filter;
    //console.log(`Filtre activité: ${filter}`);
  }

  /**
   * Retourne les activités filtrées
   */
  getFilteredActivities(): Activity[] {
    if (this.activityFilter === 'all') {
      return this.recentActivities;
    }
    
    const filterMap: { [key: string]: string[] } = {
      'missions': ['mission'],
      'candidatures': ['candidature']
    };
    
    const allowedTypes = filterMap[this.activityFilter] || [];
    return this.recentActivities.filter(activity => 
      allowedTypes.includes(activity.type)
    );
  }

  /**
   * Gère le clic sur "Voir toutes les activités"
   */
  onViewAllActivities(): void {
    //console.log('Naviguer vers toutes les activités');
    // Logique de navigation
  }

  /**
   * Gère le clic sur les actions rapides
   */
  onQuickActionClick(action: string): void {
    //console.log(`Action rapide: ${action}`);
    switch(action) {
      case 'nouvelle-mission':
        // Naviguer vers la création de mission
        break;
      case 'gerer-equipe':
        // Naviguer vers la gestion d'équipe
        break;
      case 'voir-rapports':
        // Naviguer vers les rapports
        break;
      case 'rapport':
        // Générer un rapport
        break;
      case 'parametres':
        // Ouvrir les paramètres
        break;
    }
  }

  /**
   * Simule la mise à jour des données
   */
  refreshData(): void {
    // Simulation d'une mise à jour des statistiques
    this.statCards = this.statCards.map(card => ({
      ...card,
      value: Math.max(0, card.value + Math.floor(Math.random() * 10) - 5),
      trend: +(Math.random() * 30).toFixed(1),
      trendDirection: Math.random() > 0.5 ? 'up' : 'down' as 'up' | 'down'
    }));

    // Réanimer les cartes après mise à jour
    if (this.isBrowser) {
      this.animateCards();
    }
  }

  /**
   * Affiche le tooltip
   */
  showTooltip(event: MouseEvent, title: string, value: number): void {
    if (!this.isBrowser) return;
    
    this.tooltipTitle = title;
    this.tooltipValue = value.toString();
    this.tooltipX = event.clientX + 10;
    this.tooltipY = event.clientY - 30;
    this.tooltipVisible = true;
  }

  /**
   * Cache le tooltip
   */
  hideTooltip(): void {
    this.tooltipVisible = false;
  }

  /**
   * Génère les points pour la ligne des missions
   */
  getMissionLinePoints(): string {
    return this.monthlyData.map((data, index) => {
      const x = (index * 400) / (this.monthlyData.length - 1);
      const y = 200 - (data.missions / 50 * 180);
      return `${x},${y}`;
    }).join(' ');
  }

  /**
   * Génère les points pour la ligne des postulations
   */
  getPostulationLinePoints(): string {
    return this.monthlyData.map((data, index) => {
      const x = (index * 400) / (this.monthlyData.length - 1);
      const y = 200 - (data.postulations / 100 * 180);
      return `${x},${y}`;
    }).join(' ');
  }

  /**
   * Retourne les points des missions pour les cercles
   */
  getMissionPoints(): Point[] {
    return this.monthlyData.map((data, index) => ({
      x: (index * 400) / (this.monthlyData.length - 1),
      y: 200 - (data.missions / 50 * 180)
    }));
  }

  /**
   * Retourne les points des postulations pour les cercles
   */
  getPostulationPoints(): Point[] {
    return this.monthlyData.map((data, index) => ({
      x: (index * 400) / (this.monthlyData.length - 1),
      y: 200 - (data.postulations / 100 * 180)
    }));
  }

  /**
   * Vérifie si une tendance est positive
   */
  isPositiveTrend(trend: number): boolean {
    return trend > 0;
  }

  /**
   * Retourne la classe CSS pour la couleur de tendance
   */
  getTrendClass(direction: 'up' | 'down'): string {
    return direction === 'up' ? 'trend-positive' : 'trend-negative';
  }

  /**
   * Calcule le pourcentage d'évolution
   */
  calculateTrendPercentage(current: number, previous: number): number {
    if (previous === 0) return 0;
    return +((current - previous) / previous * 100).toFixed(1);
  }
}