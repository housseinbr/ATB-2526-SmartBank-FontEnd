import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, map, Observable, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationItem } from '../models/notification';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  unreadNotifications = signal<NotificationItem[]>([]);
  allNotifications = signal<NotificationItem[]>([]);
  loadingUnread = signal(false);
  loadingAll = signal(false);

  unreadCount = computed(() => this.unreadNotifications().length);

  loadUnread(): Observable<NotificationItem[]> {
    this.loadingUnread.set(true);
    return this.http.get<NotificationItem[]>(`${this.baseUrl}/me/unread`).pipe(
      tap((notifications) => this.unreadNotifications.set(notifications)),
      finalize(() => this.loadingUnread.set(false))
    );
  }

  loadAll(): Observable<NotificationItem[]> {
    this.loadingAll.set(true);
    return this.http.get<NotificationItem[]>(`${this.baseUrl}/me`).pipe(
      tap((notifications) => this.allNotifications.set(notifications)),
      finalize(() => this.loadingAll.set(false))
    );
  }

  markAsRead(id: number): Observable<NotificationItem> {
    return this.http.patch<NotificationItem>(`${this.baseUrl}/${id}/read`, {}).pipe(
      switchMap((notification) => this.loadUnread().pipe(map(() => notification)))
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/me/read-all`, {}).pipe(
      tap(() => {
        this.unreadNotifications.set([]);
        void this.loadAll().subscribe();
      })
    );
  }
}
