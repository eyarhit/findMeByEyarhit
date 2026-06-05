import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BiDashboardComponent } from './bi-dashboard/bi-dashboard.component';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { AuthGuard } from '../guards/auth.guard';
import { AdminGuard } from '../guards/admin.guard';

const routes: Routes = [
  {
    path: 'panel',
    component: AdminPanelComponent,
    canActivate: [AuthGuard, AdminGuard],
  },
  {
    path: 'bi-dashboard',
    component: BiDashboardComponent,
    canActivate: [AuthGuard, AdminGuard],
  },
  { path: '', redirectTo: 'panel', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
