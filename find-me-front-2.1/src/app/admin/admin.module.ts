import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminRoutingModule } from './admin-routing.module';
import { BiDashboardComponent } from './bi-dashboard/bi-dashboard.component';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';

@NgModule({
  declarations: [BiDashboardComponent, AdminPanelComponent],
  imports: [CommonModule, FormsModule, RouterModule, AdminRoutingModule],
})
export class AdminModule {}
