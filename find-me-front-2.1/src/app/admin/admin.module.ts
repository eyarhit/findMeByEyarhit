import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdminRoutingModule } from './admin-routing.module';
import { BiDashboardComponent } from './bi-dashboard/bi-dashboard.component';

@NgModule({
  declarations: [BiDashboardComponent],
  imports: [CommonModule, RouterModule, AdminRoutingModule],
})
export class AdminModule {}
