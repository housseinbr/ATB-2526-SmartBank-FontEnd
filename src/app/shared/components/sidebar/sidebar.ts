import { Component, Input, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../icon/icon';
import { Role } from '../../../core/models/role';
import { SIDEBAR_CONFIG } from '../../config/sidebar-menu.config';
import { AuthService } from '../../../core/services/auth.service';

export type SidebarBadges = Partial<Record<'notifications' | 'demandes', number>>;

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private authService = inject(AuthService);
  private router = inject(Router);

  /** Rôle affiché : pilote le libellé d'espace et la liste de menu. */
  @Input({ required: true }) role!: Role;

  /** Compteurs dynamiques à afficher sur certains items (ex: notifications, demandes en attente). */
  @Input() badges: SidebarBadges = {};

  collapsed = false;

  get config() {
    return SIDEBAR_CONFIG[this.role];
  }

  get currentUser() {
    return this.authService.currentUser();
  }

  get fullName(): string {
    const user = this.currentUser;
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  get initials(): string {
    const user = this.currentUser;
    if (!user) return '';
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  }

  badgeFor(item: { badgeKey?: 'notifications' | 'demandes' }): number | null {
    if (!item.badgeKey) return null;
    return this.badges[item.badgeKey] ?? null;
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
