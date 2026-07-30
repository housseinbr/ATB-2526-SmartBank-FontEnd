import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AbsenceApiService } from '../../../core/services/absence.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { Icon } from '../../../shared/components/icon/icon';
import { Role } from '../../../core/models/role';
import {
  Absence,
  StatusAbsence,
  STATUS_COLORS,
  STATUS_LABELS,
  TYPE_ABSENCE_LABELS,
} from '../../../core/models/absence';
import { UserResponse } from '../../../core/models/user-response';

type CalendarMode = 'month' | 'week' | 'year';

interface CalendarDayCell {
  date: Date;
  dayNumber: number;
  dayName: string;
  inCurrentPeriod: boolean;
  items: Absence[];
}

interface CalendarMonthCard {
  monthIndex: number;
  label: string;
  count: number;
  items: Absence[];
}

@Component({
  selector: 'app-supervisor-calendar',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './supervisor-calendar.html',
  styleUrl: './supervisor-calendar.css',
})
export class SupervisorCalendar implements OnInit {
  requests = signal<Absence[]>([]);
  teamMembers = signal<UserResponse[]>([]);
  mode = signal<CalendarMode>('month');
  selectedDate = signal(new Date());
  selectedMemberId = signal<number | null>(null);
  loading = signal(false);

  readonly Role = Role;
  readonly StatusAbsence = StatusAbsence;
  statusColors = STATUS_COLORS;
  statusLabels = STATUS_LABELS;
  typeLabels = TYPE_ABSENCE_LABELS;

  private readonly dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  private readonly monthNames = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];

  constructor(
    private absenceApi: AbsenceApiService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser?.id || !this.authService.getToken()) {
      return;
    }

    this.loading.set(true);
    const isAdmin = currentUser.role === Role.ADMIN;

    const source = isAdmin
      ? forkJoin({
          requests: this.absenceApi.getAll(),
          members: this.userService.getAllUsersWithSupervisors(),
        })
      : forkJoin({
          requests: this.absenceApi.getMine(),
          members: this.userService.getSubordonnes(currentUser.id),
        });

    source.subscribe({
      next: ({ requests, members }) => {
        this.requests.set(this.mergeAndSort(requests, []));
        this.teamMembers.set(members);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  readonly modeLabel = computed(() => {
    switch (this.mode()) {
      case 'week':
        return 'Vue semaine';
      case 'year':
        return 'Vue annuelle';
      default:
        return 'Vue mensuelle';
    }
  });

  readonly headerLabel = computed(() => {
    const date = this.selectedDate();
    if (this.mode() === 'year') {
      return `${date.getFullYear()}`;
    }

    if (this.mode() === 'week') {
      const start = this.getWeekStart(date);
      const end = this.addDays(start, 6);
      return `${start.getDate()} ${this.monthNames[start.getMonth()]} ${start.getFullYear()} → ${end.getDate()} ${this.monthNames[end.getMonth()]} ${end.getFullYear()}`;
    }

    return `${this.monthNames[date.getMonth()]} ${date.getFullYear()}`;
  });

  readonly stats = computed(() => {
    const requests = this.filteredRequests();
    return {
      total: requests.length,
      pending: requests.filter((request) => request.status === StatusAbsence.EN_ATTENTE).length,
      approved: requests.filter((request) => request.status === StatusAbsence.VALIDE).length,
      refused: requests.filter((request) => request.status === StatusAbsence.REFUSE).length,
    };
  });

  readonly filteredRequests = computed(() => {
    const memberId = this.selectedMemberId();
    if (!memberId) {
      return this.requests();
    }

    return this.requests().filter((request) => request.user?.id === memberId);
  });

  readonly monthCells = computed<CalendarDayCell[]>(() => this.buildMonthCells());
  readonly weekCells = computed<CalendarDayCell[]>(() => this.buildWeekCells());
  readonly yearCards = computed<CalendarMonthCard[]>(() => this.buildYearCards());

  readonly selectedDayItems = computed(() => {
    const selectedDay = this.stripTime(this.selectedDate()).getTime();
    return this.filteredRequests()
      .filter((request) => {
        const start = this.stripTime(new Date(request.dateStart)).getTime();
        const end = this.stripTime(new Date(request.dateEnd)).getTime();
        return selectedDay >= start && selectedDay <= end;
      })
      .sort((left, right) => left.dateStart.localeCompare(right.dateStart));
  });

  readonly selectedMonthSummary = computed(() => {
    const monthIndex = this.selectedDate().getMonth();
    const year = this.selectedDate().getFullYear();
    const items = this.filteredRequests().filter((request) => this.rangeIntersectsMonth(request, year, monthIndex));
    return {
      count: items.length,
      approved: items.filter((item) => item.status === StatusAbsence.VALIDE).length,
      pending: items.filter((item) => item.status === StatusAbsence.EN_ATTENTE).length,
      refused: items.filter((item) => item.status === StatusAbsence.REFUSE).length,
    };
  });

  setMode(mode: CalendarMode): void {
    this.mode.set(mode);
  }

  previous(): void {
    const current = new Date(this.selectedDate());
    if (this.mode() === 'year') {
      current.setFullYear(current.getFullYear() - 1);
    } else if (this.mode() === 'week') {
      current.setDate(current.getDate() - 7);
    } else {
      current.setMonth(current.getMonth() - 1);
    }
    this.selectedDate.set(current);
  }

  next(): void {
    const current = new Date(this.selectedDate());
    if (this.mode() === 'year') {
      current.setFullYear(current.getFullYear() + 1);
    } else if (this.mode() === 'week') {
      current.setDate(current.getDate() + 7);
    } else {
      current.setMonth(current.getMonth() + 1);
    }
    this.selectedDate.set(current);
  }

  today(): void {
    this.selectedDate.set(new Date());
  }

  selectDate(date: Date): void {
    this.selectedDate.set(new Date(date));
  }

  selectMonth(monthIndex: number): void {
    const current = new Date(this.selectedDate());
    this.selectedDate.set(new Date(current.getFullYear(), monthIndex, 1));
  }

  clearMemberFilter(): void {
    this.selectedMemberId.set(null);
  }

  selectMember(member: UserResponse): void {
    this.selectedMemberId.set(member.id);
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0) ?? '';
    const last = lastName?.charAt(0) ?? '';
    return `${first}${last}` || '?';
  }

  shortDay(date: Date): string {
    return this.dayNames[this.getMondayBasedDay(date)];
  }

  formatDate(date: Date | string): string {
    const value = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(value.getTime())) {
      return String(date);
    }
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(value);
  }

  dayItems(date: Date): Absence[] {
    return this.filteredRequests().filter((request) => this.dateInRange(date, request));
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isSelected(date: Date): boolean {
    return this.stripTime(date).toDateString() === this.stripTime(this.selectedDate()).toDateString();
  }

  statusTone(status?: StatusAbsence): 'green' | 'amber' | 'red' | 'slate' {
    switch (status) {
      case StatusAbsence.VALIDE:
        return 'green';
      case StatusAbsence.EN_ATTENTE:
        return 'amber';
      case StatusAbsence.REFUSE:
        return 'red';
      default:
        return 'slate';
    }
  }

  private buildMonthCells(): CalendarDayCell[] {
    const baseDate = new Date(this.selectedDate());
    const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const startOffset = (this.getMondayBasedDay(firstDay) + 6) % 7;
    const start = this.addDays(firstDay, -startOffset);
    const cells: CalendarDayCell[] = [];

    for (let index = 0; index < 42; index++) {
      const current = this.addDays(start, index);
      cells.push({
        date: current,
        dayNumber: current.getDate(),
        dayName: this.dayNames[this.getMondayBasedDay(current)],
        inCurrentPeriod: current.getMonth() === baseDate.getMonth(),
        items: this.dayItems(current),
      });
    }

    return cells;
  }

  private buildWeekCells(): CalendarDayCell[] {
    const start = this.getWeekStart(this.selectedDate());
    return Array.from({ length: 7 }, (_, index) => {
      const current = this.addDays(start, index);
      return {
        date: current,
        dayNumber: current.getDate(),
        dayName: this.dayNames[index],
        inCurrentPeriod: true,
        items: this.dayItems(current),
      };
    });
  }

  private buildYearCards(): CalendarMonthCard[] {
    const year = this.selectedDate().getFullYear();
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const items = this.filteredRequests().filter((request) => this.rangeIntersectsMonth(request, year, monthIndex));
      return {
        monthIndex,
        label: this.monthNames[monthIndex],
        count: items.length,
        items: items.slice(0, 3),
      };
    });
  }

  private mergeAndSort(requests: Absence[], extra: Absence[]): Absence[] {
    return [...requests, ...extra].sort((left, right) => {
      const leftDate = `${left.dateStart}${left.dateEnd}`;
      const rightDate = `${right.dateStart}${right.dateEnd}`;
      return leftDate.localeCompare(rightDate);
    });
  }

  private dateInRange(date: Date, request: Absence): boolean {
    const dayStart = this.stripTime(date).getTime();
    const rangeStart = this.stripTime(new Date(request.dateStart)).getTime();
    const rangeEnd = this.stripTime(new Date(request.dateEnd)).getTime();
    return dayStart >= rangeStart && dayStart <= rangeEnd;
  }

  private rangeIntersectsMonth(request: Absence, year: number, monthIndex: number): boolean {
    const rangeStart = new Date(request.dateStart);
    const rangeEnd = new Date(request.dateEnd);
    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 0);
    return rangeStart <= monthEnd && rangeEnd >= monthStart;
  }

  private getWeekStart(date: Date): Date {
    const current = new Date(date);
    const mondayBased = this.getMondayBasedDay(current);
    return this.addDays(current, -mondayBased);
  }

  private getMondayBasedDay(date: Date): number {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
