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
            path: 'users/:id/competances',
            loadComponent: () => import('./features/competances/competances').then(m => m.CompetancesPage),
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
          {
            path: 'formations',
            loadComponent: () => import('./features/formations/formations-hub/formations-hub').then(m => m.FormationsHub),
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
            path: 'formations',
            loadComponent: () => import('./features/formations/formations-hub/formations-hub').then(m => m.FormationsHub),
          },
          {
            path: 'formation-lab',
            loadComponent: () => import('./features/formations/formations-hub/formations-hub').then(m => m.FormationsHub),
          },
          {
            path: 'mes-formations',
            loadComponent: () => import('./features/formations/formation-demandes-hub/formation-demandes-hub').then(m => m.FormationDemandesHub),
          },
          {
            path: 'competances',
            loadComponent: () => import('./features/competances/competances').then(m => m.CompetancesPage),
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
        path: 'formation-lab',
        canActivate: [roleGuard(Role.EMPLOYE, Role.SUPERVISEUR, Role.ADMIN)],
        loadComponent: () => import('./features/formations/lab/formation-lab').then(m => m.FormationLab),
      },
      {
        path: 'mes-formations',
        canActivate: [roleGuard(Role.EMPLOYE, Role.SUPERVISEUR, Role.ADMIN)],
        loadComponent: () => import('./features/formations/my-formations/my-formations').then(m => m.MyFormations),
      },
      {
        path: 'competances',
        canActivate: [roleGuard(Role.EMPLOYE, Role.SUPERVISEUR, Role.ADMIN)],
        loadComponent: () => import('./features/competances/competances').then(m => m.CompetancesPage),
      },
      {
        path: 'formations',
        canActivate: [roleGuard(Role.EMPLOYE, Role.SUPERVISEUR, Role.ADMIN)],
        loadComponent: () => import('./features/formations/formations-hub/formations-hub').then(m => m.FormationsHub),
      },
      {
        path: 'formation-demandes',
        canActivate: [roleGuard(Role.EMPLOYE, Role.SUPERVISEUR, Role.ADMIN)],
        loadComponent: () => import('./features/formations/formation-demandes-hub/formation-demandes-hub').then(m => m.FormationDemandesHub),
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
