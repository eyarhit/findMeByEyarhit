import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BiDashboardComponent } from './bi-dashboard/bi-dashboard.component';
import { AuthGuard } from '../guards/auth.guard';
import { AdminGuard } from '../guards/admin.guard';

const routes: Routes = [
  {
    path: 'bi-dashboard',
    component: BiDashboardComponent,
    canActivate: [AuthGuard, AdminGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
