import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { AdminRoutingModule } from './admin-routing.module';
import { BiDashboardComponent } from './bi-dashboard/bi-dashboard.component';

@NgModule({
  declarations: [BiDashboardComponent],
  imports: [CommonModule, FormsModule, HttpClientModule, AdminRoutingModule],
  exports: [BiDashboardComponent],
})
export class AdminModule {}
