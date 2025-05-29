import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { Role } from './models/role.model';
import { RoleGuard } from './guards/role.guard';
import { LoginComponent } from './views/login/login.component';
import { AdminComponent } from './views/admin/admin.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { NotFoundComponent } from './views/not-found/not-found.component';
import { LandingComponent } from './views/landing/landing.component';

export const routes: Routes = [
//   { path: '', component: HomeComponent },

  //(publique)
  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: 'landing',
    component: LandingComponent
  },


  // section utilisateurs protégée
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },

  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.ADMIN] },
  },

  {
    path: 'not-found',
    component: NotFoundComponent,
    canActivate: [AuthGuard]
  },

  // autres modules (ex. devices, projects)…
//   {
//     path: 'devices',
//     loadChildren: () => import('./devices/devices.routes').then(m => m.ROUTES),
//     canActivate: [AuthGuard],
//   },

  // fallback
  {
    path: '**',
    redirectTo: 'not-found'
  },
];