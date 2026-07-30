import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
import { Icon } from '../../../shared/components/icon/icon';
import { AbsenceApiService } from '../../../core/services/absence.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  Absence,
  HistorySold,
  StatusAbsence,
  STATUS_COLORS,
  STATUS_LABELS,
  TYPE_ABSENCE_LABELS,
  TypeAbsence,
} from '../../../core/models/absence';
import { UserResponse } from '../../../core/models/user-response';
import { NotificationItem } from '../../../core/models/notification';

interface StatusChartItem {
  label: string;
  value: number;
  color: string;
}

interface BalancePoint {
  month: string;
  value: number;
}

interface RequestItemView {
  type: string;
  dates: string;
  days: number;
  status: string;
  statusColor: 'green' | 'orange' | 'red';
  ref: string;
}

interface LeaveBreakdownItem {
  label: string;
  used: number;
  share: number;
  color: 'red' | 'dark' | 'gray';
}

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.css',
})
export class EmployeeDashboard implements OnInit {
  private readonly chartPadding = { top: 20, right: 12, bottom: 36, left: 12 };
  readonly donutRadius = 15.9155;

  loading = signal(false);
  profile = signal<UserResponse | null>(null);
  absences = signal<Absence[]>([]);
  history = signal<HistorySold[]>([]);
  notifications = signal<NotificationItem[]>([]);

  readonly StatusAbsence = StatusAbsence;
  readonly statusLabels = STATUS_LABELS;
  readonly statusColors = STATUS_COLORS;
  readonly typeLabels = TYPE_ABSENCE_LABELS;

  constructor(
    private absenceApi: AbsenceApiService,
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser?.id) {
      return;
    }

    this.loading.set(true);
    forkJoin({
      profile: this.userService.getUserById(currentUser.id).pipe(catchError(() => of(null))),
      absences: this.absenceApi.getMine().pipe(catchError(() => of([] as Absence[]))),
      history: this.absenceApi.getMineHistory().pipe(catchError(() => of([] as HistorySold[]))),
      notifications: this.notificationService.loadAll().pipe(catchError(() => of([] as NotificationItem[]))),
    }).subscribe({
      next: ({ profile, absences, history, notifications }) => {
        this.profile.set(profile);
        this.absences.set(absences);
        this.history.set(history);
        this.notifications.set(notifications);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  readonly stats = computed(() => ({
    soldeActuel: this.profile()?.solde ?? 0,
    approuvees: this.approvedAbsences().length,
    enAttente: this.pendingAbsences().length,
    refusees: this.refusedAbsences().length,
    notifications: this.unreadNotifications().length,
    totalDemandes: this.absences().length,
  }));

  readonly statusChartData = computed<StatusChartItem[]>(() => [
    { label: 'Approuvées', value: this.approvedAbsences().length, color: '#16a34a' },
    { label: 'En attente', value: this.pendingAbsences().length, color: '#d97706' },
    { label: 'Refusées', value: this.refusedAbsences().length, color: '#a4182a' },
  ]);

  readonly leaveBreakdown = computed<LeaveBreakdownItem[]>(() => {
    const approvedRequests = this.approvedAbsences();
    const annualDays = this.sumDaysByType(approvedRequests, [TypeAbsence.CONGE, TypeAbsence.PAYE]);
    const sicknessDays = this.sumDaysByType(approvedRequests, [TypeAbsence.MALADE]);
    const otherDays = this.sumDaysByType(approvedRequests, [TypeAbsence.NON_PAYE, TypeAbsence.AUTRE]);
    const totalDays = annualDays + sicknessDays + otherDays || 1;

    return [
      { label: 'Congés payés', used: annualDays, share: (annualDays / totalDays) * 100, color: 'red' },
      { label: 'Congés maladie', used: sicknessDays, share: (sicknessDays / totalDays) * 100, color: 'dark' },
      { label: 'Autres absences', used: otherDays, share: (otherDays / totalDays) * 100, color: 'gray' },
    ];
  });

  readonly balanceEvolution = computed<BalancePoint[]>(() => this.buildBalanceEvolution());

  readonly recentRequests = computed<RequestItemView[]>(() =>
    [...this.absences()]
      .sort((left, right) => right.dateStart.localeCompare(left.dateStart))
      .slice(0, 3)
      .map((request) => ({
        type: this.typeLabels[request.type],
        dates: `${this.formatDate(request.dateStart)} → ${this.formatDate(request.dateEnd)}`,
        days: this.calculateDays(request),
        status: this.statusLabels[request.status ?? StatusAbsence.EN_ATTENTE],
        statusColor: this.statusTone(request.status),
        ref: `REQ-${String(request.idAbcance ?? 0).padStart(4, '0')}`,
      }))
  );

  readonly recentNotifications = computed(() =>
    [...this.notifications()]
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, 3)
  );

  readonly lineChartWidth = 640;
  readonly lineChartHeight = 220;

  get statusTotal(): number {
    return this.statusChartData().reduce((total, item) => total + item.value, 0) || 1;
  }

  get donutCircumference(): number {
    return 2 * Math.PI * this.donutRadius;
  }

  get lineChartMax(): number {
    return Math.max(...this.balanceEvolution().map((item) => item.value), 1);
  }

  get lineChartYGrid(): number[] {
    return [0, 25, 50, 75, 100];
  }

  get latestHistoryLabel(): string {
    const latestEntry = this.history()[0];
    return latestEntry ? this.formatDate(latestEntry.dateAction) : '—';
  }

  get linePath(): string {
    const points = this.linePoints();
    if (points.length === 0) {
      return '';
    }

    return points.reduce((path, point, index) => `${path}${index === 0 ? 'M' : 'L'} ${point.x} ${point.y} `, '').trim();
  }

  get areaPath(): string {
    const points = this.linePoints();
    if (points.length === 0) {
      return '';
    }

    const first = points[0];
    const last = points[points.length - 1];
    return `${this.linePath} L ${last.x} ${this.lineChartHeight - this.chartPadding.bottom} L ${first.x} ${this.lineChartHeight - this.chartPadding.bottom} Z`;
  }

  linePoints(): Array<{ x: number; y: number; month: string; value: number }> {
    const points = this.balanceEvolution();
    const chartWidth = this.lineChartWidth - this.chartPadding.left - this.chartPadding.right;
    const chartHeight = this.lineChartHeight - this.chartPadding.top - this.chartPadding.bottom;
    const step = points.length > 1 ? chartWidth / (points.length - 1) : 0;

    return points.map((item, index) => {
      const x = this.chartPadding.left + index * step;
      const y = this.chartPadding.top + chartHeight * (1 - item.value / this.lineChartMax);
      return { x, y, month: item.month, value: item.value };
    });
  }

  getPieOffset(index: number): number {
    const cumulative = this.statusChartData()
      .slice(0, index)
      .reduce((total, item) => total + item.value, 0);
    return -((cumulative / this.statusTotal) * this.donutCircumference);
  }

  getDonutDasharray(value: number): string {
    const length = (value / this.statusTotal) * this.donutCircumference;
    return `${length} ${this.donutCircumference}`;
  }

  private approvedAbsences(): Absence[] {
    return this.absences().filter((request) => request.status === StatusAbsence.VALIDE);
  }

  private pendingAbsences(): Absence[] {
    return this.absences().filter((request) => request.status === StatusAbsence.EN_ATTENTE);
  }

  private refusedAbsences(): Absence[] {
    return this.absences().filter((request) => request.status === StatusAbsence.REFUSE);
  }

  private unreadNotifications(): NotificationItem[] {
    return this.notifications().filter((notification) => !notification.read);
  }

  private sumDaysByType(requests: Absence[], types: TypeAbsence[]): number {
    return requests
      .filter((request) => types.includes(request.type))
      .reduce((total, request) => total + this.calculateDays(request), 0);
  }

  private buildBalanceEvolution(): BalancePoint[] {
    const currentBalance = this.profile()?.solde ?? 0;
    const sortedHistory = [...this.history()].sort((left, right) => left.dateAction.localeCompare(right.dateAction));
    const currentDate = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (5 - index), 1);
      return {
        monthIndex: monthDate.getMonth(),
        year: monthDate.getFullYear(),
        month: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(monthDate),
      };
    });

    let fallbackBalance = currentBalance;

    return months.map(({ monthIndex, year, month }) => {
      const entries = sortedHistory.filter((entry) => {
        const entryDate = new Date(entry.dateAction);
        return entryDate.getMonth() === monthIndex && entryDate.getFullYear() === year;
      });

      const latestEntry = entries.at(-1);
      if (latestEntry) {
        fallbackBalance = latestEntry.soldeAfter;
        return { month, value: latestEntry.soldeAfter };
      }

      return { month, value: fallbackBalance };
    });
  }

  private calculateDays(request: Absence): number {
    const startDate = new Date(request.dateStart);
    const endDate = new Date(request.dateEnd);
    const inclusiveDays = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;

    if (inclusiveDays === 1 && request.demiJournee) {
      return 0.5;
    }

    return inclusiveDays;
  }

  private formatDate(date: string): string {
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) {
      return date;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(value);
  }

  private statusTone(status?: StatusAbsence): 'green' | 'orange' | 'red' {
    switch (status) {
      case StatusAbsence.VALIDE:
        return 'green';
      case StatusAbsence.EN_ATTENTE:
        return 'orange';
      case StatusAbsence.REFUSE:
        return 'red';
      default:
        return 'orange';
    }
  }
}
