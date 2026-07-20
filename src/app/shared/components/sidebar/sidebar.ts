import { Component, input, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Icon } from '../icon/icon';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models/role';
import { SIDEBAR_CONFIG } from '../../config/sidebar-menu.config';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, Icon],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private authService = inject(AuthService);

  role = input.required<Role>();
  badges = input<{ notifications?: number; demandes?: number }>({});

  collapsedChange = output<boolean>();

  isCollapsed = signal(false);

  config = SIDEBAR_CONFIG;

  get user() {
    return this.authService.currentUser();
  }

  get initials(): string {
    const u = this.user;
    if (!u?.firstName || !u?.lastName) return '??';
    return (u.firstName[0] + u.lastName[0]).toUpperCase();
  }

  get fullName(): string {
    const u = this.user;
    if (!u?.firstName || !u?.lastName) return 'Utilisateur';
    return `${u.firstName} ${u.lastName}`;
  }

  get email(): string {
    return this.user?.email || '';
  }

  badgeFor(item: { badgeKey?: string }): number | undefined {
    const key = item.badgeKey;
    if (!key) return undefined;
    return this.badges()[key as 'notifications' | 'demandes'];
  }

  toggleSidebar() {
    this.isCollapsed.update(v => !v);
    this.collapsedChange.emit(this.isCollapsed());
  }

  logout() {
    this.authService.logout();
  }
}