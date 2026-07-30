import { Component, input, inject, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Icon } from '../icon/icon';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models/role';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationItem } from '../../../core/models/notification';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);
  private notificationService = inject(NotificationService);

  pageTitle = input<string>('');

  user = this.authService.currentUser;

  isProfileMenuOpen = false;
  isNotificationMenuOpen = false;

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
  notifications = this.notificationService.unreadNotifications;
  unreadCount = this.notificationService.unreadCount;

  ngOnInit(): void {
    this.refreshNotifications();
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue = value;
  }

  refreshNotifications(): void {
    this.notificationService.loadUnread().subscribe();
  }

  openNotifications(): void {
    this.isNotificationMenuOpen = !this.isNotificationMenuOpen;
    if (this.isNotificationMenuOpen) {
      this.isProfileMenuOpen = false;
      this.refreshNotifications();
    }
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    if (this.isProfileMenuOpen) {
      this.isNotificationMenuOpen = false;
    }
  }

  closeProfileMenu() {
    this.isProfileMenuOpen = false;
  }

  closeNotificationMenu(): void {
    this.isNotificationMenuOpen = false;
  }

  goToProfile() {
    this.closeProfileMenu();
    this.router.navigate(['/dashboard/profile']);
  }

  goToNotifications(): void {
    this.closeNotificationMenu();
    this.router.navigate(['/dashboard/notifications']);
  }

  openNotification(notification: NotificationItem): void {
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        this.goToNotifications();
      },
    });
  }

  logout() {
  this.closeProfileMenu();
  this.authService.logout();
  window.location.href = '/login';
}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if ((this.isProfileMenuOpen || this.isNotificationMenuOpen) && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeProfileMenu();
      this.closeNotificationMenu();
    }
  }
}
