import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminRoutingModule } from './admin-routing.module';
import { BiDashboardComponent } from './bi-dashboard/bi-dashboard.component';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { AdminStatsComponent } from './admin-stats/admin-stats.component';
import { CvVisualisationModule } from '../components/visualisation-cv/cv-visualisation.module';

@NgModule({
  declarations: [BiDashboardComponent, AdminPanelComponent, AdminStatsComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, AdminRoutingModule, CvVisualisationModule],
})
export class AdminModule {}
