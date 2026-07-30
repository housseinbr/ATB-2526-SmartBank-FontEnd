import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Icon } from '../../shared/components/icon/icon';
import { NotificationItem } from '../../core/models/notification';
import { NotificationService } from '../../core/services/notification.service';

type NotificationFilter = 'ALL' | 'UNREAD' | 'READ';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class NotificationsPage implements OnInit {
  private notificationService = inject(NotificationService);

  filter = signal<NotificationFilter>('ALL');
  loading = signal(false);

  notifications = this.notificationService.allNotifications;
  unreadNotifications = this.notificationService.unreadNotifications;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.notificationService.loadAll().subscribe({
      next: () => {
        void this.notificationService.loadUnread().subscribe({
          complete: () => this.loading.set(false),
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  setFilter(filter: NotificationFilter): void {
    this.filter.set(filter);
  }

  markAsRead(notification: NotificationItem): void {
    if (notification.read) {
      return;
    }

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => this.reload(),
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => this.reload(),
    });
  }

  readonly filteredNotifications = computed(() => {
    const notifications = this.notifications();
    switch (this.filter()) {
      case 'READ':
        return notifications.filter((notification) => notification.read);
      case 'UNREAD':
        return notifications.filter((notification) => !notification.read);
      default:
        return notifications;
    }
  });

  readonly stats = computed(() => {
    const notifications = this.notifications();
    return {
      total: notifications.length,
      unread: notifications.filter((notification) => !notification.read).length,
      read: notifications.filter((notification) => notification.read).length,
    };
  });

  get emptyMessage(): string {
    switch (this.filter()) {
      case 'READ':
        return 'Aucune notification lue pour le moment.';
      case 'UNREAD':
        return 'Aucune notification non lue pour le moment.';
      default:
        return 'Aucune notification disponible pour le moment.';
    }
  }

  formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
}
