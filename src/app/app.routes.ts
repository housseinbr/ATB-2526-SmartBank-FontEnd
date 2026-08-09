import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { Role } from './core/models/role';
import { ForgotPassword } from './features/auth/forgot-password/forgot-password';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'forgot-password', component: ForgotPassword },

  
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/dashboard-layout/dashboard-layout').then(m => m.DashboardLayout),
    children: [
      {
        path: 'admin',
        canActivate: [roleGuard(Role.ADMIN)],
        children: [
          { path: '', redirectTo: 'users', pathMatch: 'full' },
          {
            path: 'users/:id/donnees',
            loadComponent: () => import('./features/profile-data/profile-data').then(m => m.ProfileData),
          },
          {
            path: 'users',
            loadComponent: () => import('./features/admin/dashboard/admin-dashboard').then(m => m.AdminDashboard),
          },
          {
            path: 'demandes',
            loadComponent: () => import('./features/supervisor/requests/supervisor-requests').then(m => m.SupervisorRequests),
          },
          {
            path: 'calendrier',
            loadComponent: () => import('./features/supervisor/calendar/supervisor-calendar').then(m => m.SupervisorCalendar),
          },
        ],
      },
      {
        path: 'superviseur',
        canActivate: [roleGuard(Role.SUPERVISEUR)],
        children: [
          { path: '', redirectTo: 'team', pathMatch: 'full' },
          {
            path: 'team',
            loadComponent: () => import('./features/supervisor/dashboard/supervisor-dashboard').then(m => m.SupervisorDashboard),
          },
          {
            path: 'demandes',
            loadComponent: () => import('./features/supervisor/requests/supervisor-requests').then(m => m.SupervisorRequests),
          },
          {
            path: 'calendrier',
            loadComponent: () => import('./features/supervisor/calendar/supervisor-calendar').then(m => m.SupervisorCalendar),
          },
        ],
      },
      {
        path: 'employe',
        canActivate: [roleGuard(Role.EMPLOYE)],
        loadComponent: () => import('./features/employee/dashboard/employee-dashboard').then(m => m.EmployeeDashboard),
      },
      {
        path: 'absences',
        canActivate: [roleGuard(Role.EMPLOYE, Role.SUPERVISEUR)],
        loadComponent: () => import('./features/employee/absence/absence').then(m => m.MesAbsences),
      },
      {
        path: 'mes-donnees',
        canActivate: [roleGuard(Role.EMPLOYE, Role.SUPERVISEUR)],
        loadComponent: () => import('./features/profile-data/profile-data').then(m => m.ProfileData),
      },
      // Profile - accessible to all authenticated users (inside layout)
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then(m => m.Profile),
      },
      {
        path: 'comments',
        canActivate: [roleGuard(Role.EMPLOYE, Role.SUPERVISEUR, Role.ADMIN)],
        loadComponent: () => import('./features/comments/comments-page').then(m => m.CommentsPage),
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications').then(m => m.NotificationsPage),
      },
      { path: '', redirectTo: 'employe', pathMatch: 'full' },

    ],
  },

  // Fallback
  { path: '**', redirectTo: 'login' },
];
