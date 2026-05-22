import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { AdminRoutingModule } from './admin-routing.module';
import { BiDashboardComponent } from './bi-dashboard/bi-dashboard.component';

@NgModule({
  declarations: [BiDashboardComponent],
  imports: [CommonModule, HttpClientModule, AdminRoutingModule],
})
export class AdminModule {}
