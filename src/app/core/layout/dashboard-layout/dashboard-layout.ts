import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Topbar } from '../../../shared/components/topbar/topbar';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models/role';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar, Topbar],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css',
})
export class DashboardLayout {
  private authService = inject(AuthService);

  isSidebarCollapsed = signal(false);

  role = computed(() => this.authService.currentUser()?.role ?? Role.EMPLOYE);
  
  // ← AJOUTE CE GETTER
  get badges() {
    return this.authService.badges;
  }
  
  pageTitle = computed(() => {
    const r = this.role();
    switch (r) {
      case Role.ADMIN: return 'Gestion des utilisateurs';
      case Role.SUPERVISEUR: return 'Tableau de bord';
      default: return 'Tableau de bord';
    }
  });

  onCollapsedChange(collapsed: boolean) {
    this.isSidebarCollapsed.set(collapsed);
  }
}