import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Topbar } from '../../../shared/components/topbar/topbar';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Role } from '../../models/role';
import { filter } from 'rxjs';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar, Topbar],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css',
})
export class DashboardLayout {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  isSidebarCollapsed = signal(false);
  routeTitle = signal('Tableau de bord');

  role = computed(() => this.authService.currentUser()?.role ?? Role.EMPLOYE);
  
  // ← AJOUTE CE GETTER
  get badges() {
    return {
      ...this.authService.badges,
      notifications: this.notificationService.unreadCount(),
    };
  }
  
  pageTitle = computed(() => {
    return this.routeTitle();
  });

  constructor() {
    this.updateTitle(this.router.url);
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe({
      next: (event) => this.updateTitle(event.urlAfterRedirects),
    });
  }

  onCollapsedChange(collapsed: boolean) {
    this.isSidebarCollapsed.set(collapsed);
  }

  private updateTitle(url: string) {
    if (url.includes('/dashboard/formation-lab') || url.includes('/dashboard/superviseur/formation-lab')) {
      this.routeTitle.set('Formation Lab');
      return;
    }
    if (url.includes('/dashboard/mes-formations') || url.includes('/dashboard/superviseur/mes-formations')) {
      this.routeTitle.set('Mes formations');
      return;
    }
    if (url.includes('/dashboard/formations') || url.includes('/dashboard/admin/formations')) {
      this.routeTitle.set('Formations');
      return;
    }
    if (url.includes('/dashboard/formation-demandes')) {
      this.routeTitle.set('Demandes formations');
      return;
    }
    if (url.includes('/dashboard/admin/demandes')) {
      this.routeTitle.set('Demandes');
      return;
    }
    if (url.includes('/dashboard/admin/calendrier')) {
      this.routeTitle.set('Calendrier');
      return;
    }
    if (url.includes('/dashboard/admin/users/') && url.includes('/donnees')) {
      this.routeTitle.set('Données utilisateur');
      return;
    }
    if (url.includes('/dashboard/admin/users')) {
      this.routeTitle.set('Utilisateurs');
      return;
    }
    if (url.includes('/dashboard/superviseur/team')) {
      this.routeTitle.set('Mon équipe');
      return;
    }
    if (url.includes('/dashboard/superviseur/demandes')) {
      this.routeTitle.set('Demandes');
      return;
    }
    if (url.includes('/dashboard/superviseur/calendrier')) {
      this.routeTitle.set('Calendrier');
      return;
    }
    if (url.includes('/dashboard/absences')) {
      this.routeTitle.set('Mes absences');
      return;
    }
    if (url.includes('/dashboard/mes-donnees')) {
      this.routeTitle.set('Mes données');
      return;
    }
    if (url.includes('/dashboard/employe')) {
      this.routeTitle.set('Espace Employé');
      return;
    }
    if (url.includes('/dashboard/admin')) {
      this.routeTitle.set('Espace Admin');
      return;
    }
    this.routeTitle.set('Tableau de bord');
  }
}
