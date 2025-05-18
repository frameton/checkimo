import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';

import { AuthGuard } from './guards/auth.guard';
import { Role } from './models/role.model';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
//   { path: '', component: HomeComponent },

  // page de connexion (publique)
  { path: 'login', component: LoginComponent },

  // section utilisateurs protégée
//   {
//     path: 'users',
//     loadChildren: () => import('./users/users.routes').then(m => m.ROUTES),
//     canActivate: [AuthGuard, RoleGuard],
//     data: { roles: [Role.ADMIN] },
//   },

  // autres modules (ex. devices, projects)…
//   {
//     path: 'devices',
//     loadChildren: () => import('./devices/devices.routes').then(m => m.ROUTES),
//     canActivate: [AuthGuard],
//   },

  // fallback
  { path: '**', redirectTo: '' },
];