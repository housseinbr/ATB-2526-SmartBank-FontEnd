import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { Role } from './core/models/role';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },

  // Dashboard layout avec sidebar + topbar
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/dashboard-layout/dashboard-layout').then(m => m.DashboardLayout),
    children: [
      {
        path: 'admin',
        canActivate: [roleGuard(Role.ADMIN)],
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard').then(m => m.AdminDashboard),
      },
      {
        path: 'superviseur',
        canActivate: [roleGuard(Role.SUPERVISEUR)],
        loadComponent: () => import('./features/supervisor/dashboard/supervisor-dashboard').then(m => m.SupervisorDashboard),
      },
      {
        path: 'employe',
        canActivate: [roleGuard(Role.EMPLOYE)],
        loadComponent: () => import('./features/employee/dashboard/employee-dashboard').then(m => m.EmployeeDashboard),
      },
      // Profile - accessible to all authenticated users (inside layout)
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then(m => m.Profile),
      },
      { path: '', redirectTo: 'employe', pathMatch: 'full' },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'login' },
];
