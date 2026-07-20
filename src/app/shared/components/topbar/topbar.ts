import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Icon } from '../icon/icon';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models/role';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  private authService = inject(AuthService);

  pageTitle = input<string>('');

  user = this.authService.currentUser;

  get initials(): string {
    const u = this.user();
    if (!u?.firstName || !u?.lastName) return '??';
    return (u.firstName[0] + u.lastName[0]).toUpperCase();
  }

  get fullName(): string {
    const u = this.user();
    if (!u?.firstName || !u?.lastName) return 'Utilisateur';
    return `${u.firstName} ${u.lastName}`;
  }

  get roleLabel(): string {
    const u = this.user();
    if (!u?.role) return '';
    switch (u.role) {
      case Role.ADMIN: return 'Administrateur';
      case Role.SUPERVISEUR: return 'Superviseur';
      case Role.EMPLOYE: return 'Employé';
      default: return u.role;
    }
  }

  searchValue = '';

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue = value;
  }

  logout() {
    this.authService.logout();
  }
}
