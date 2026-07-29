import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AbsenceApiService } from '../../../core/services/absence.service';
import { AuthService } from '../../../core/services/auth.service';
import { Absence, StatusAbsence, STATUS_COLORS, STATUS_LABELS, TYPE_ABSENCE_LABELS } from '../../../core/models/absence';

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
  imports: [CommonModule],
  templateUrl: './supervisor-calendar.html',
  styleUrl: './supervisor-calendar.css',
})
export class SupervisorCalendar implements OnInit {
  requests = signal<Absence[]>([]);
  mode = signal<CalendarMode>('month');
  selectedDate = signal(new Date());
  loading = signal(false);

  readonly StatusAbsence = StatusAbsence;
  statusColors = STATUS_COLORS;
  statusLabels = STATUS_LABELS;
  typeLabels = TYPE_ABSENCE_LABELS;

  private readonly dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  private readonly monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];

  constructor(
    private absenceApi: AbsenceApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.authService.getToken()) {
      return;
    }

    this.loading.set(true);
    forkJoin([this.absenceApi.getMine(), this.absenceApi.getTeamAbsences()]).subscribe({
      next: ([mine, team]) => {
        this.requests.set(this.mergeAndSort(mine, team));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  modeLabel = computed(() => {
    switch (this.mode()) {
      case 'week':
        return 'Vue semaine';
      case 'year':
        return 'Vue annuelle';
      default:
        return 'Vue mensuelle';
    }
  });

  headerLabel = computed(() => {
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

  stats = computed(() => {
    const requests = this.requests();
    return {
      total: requests.length,
      pending: requests.filter((request) => request.status === StatusAbsence.EN_ATTENTE).length,
      approved: requests.filter((request) => request.status === StatusAbsence.VALIDE).length,
      refused: requests.filter((request) => request.status === StatusAbsence.REFUSE).length,
    };
  });

  monthCells = computed<CalendarDayCell[]>(() => this.buildMonthCells());
  weekCells = computed<CalendarDayCell[]>(() => this.buildWeekCells());
  yearCards = computed<CalendarMonthCard[]>(() => this.buildYearCards());

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

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0) ?? '';
    const last = lastName?.charAt(0) ?? '';
    return `${first}${last}` || '?';
  }

  shortDay(date: Date): string {
    return this.dayNames[this.getMondayBasedDay(date)];
  }

  dayNumber(date: Date): number {
    return date.getDate();
  }

  dayItems(date: Date): Absence[] {
    return this.requests().filter((request) => this.dateInRange(date, request));
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
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
      const items = this.requests().filter((request) => this.rangeIntersectsMonth(request, year, monthIndex));
      return {
        monthIndex,
        label: this.monthNames[monthIndex],
        count: items.length,
        items: items.slice(0, 3),
      };
    });
  }

  private mergeAndSort(mine: Absence[], team: Absence[]): Absence[] {
    return [...mine, ...team].sort((left, right) => {
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
