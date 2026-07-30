import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { Icon } from '../../../shared/components/icon/icon';
import { Toast, ToastType } from '../../../shared/components/toast/toast';
import { AbsenceApiService } from '../../../core/services/absence.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { Role } from '../../../core/models/role';
import { Absence, StatusAbsence, STATUS_COLORS } from '../../../core/models/absence';
import { UserResponse } from '../../../core/models/user-response';

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [CommonModule, Icon, Toast],
  templateUrl: './supervisor-dashboard.html',
  styleUrl: './supervisor-dashboard.css',
})
export class SupervisorDashboard implements OnInit {
  teamMembers = signal<UserResponse[]>([]);
  teamAbsences = signal<Absence[]>([]);
  selectedMemberId = signal<number | null>(null);
  loading = signal(false);

  toastMessage = signal('');
  toastType = signal<ToastType>('success');
  toastVisible = signal(false);

  statusColors = STATUS_COLORS;
  readonly StatusAbsence = StatusAbsence;

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
    if (!currentUser?.id) {
      this.showToast('Session introuvable, veuillez vous reconnecter', 'error');
      return;
    }

    this.loading.set(true);
    this.userService.getSubordonnes(currentUser.id).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (members: UserResponse[]) => this.teamMembers.set(members),
      error: () => this.showToast("Impossible de charger l'équipe", 'error'),
    });

    this.absenceApi.getTeamAbsences().subscribe({
      next: (data) => this.teamAbsences.set(data),
      error: () => this.showToast('Impossible de charger les absences de l’équipe', 'error'),
    });
  }

  stats = computed(() => {
    const members = this.teamMembers();
    const absences = this.teamAbsences();
    return {
      members: members.length,
      employees: members.filter((member) => member.role === Role.EMPLOYE).length,
      supervisors: members.filter((member) => member.role === Role.SUPERVISEUR).length,
      validated: absences.filter((absence) => absence.status === StatusAbsence.VALIDE).length,
      pending: absences.filter((absence) => absence.status === StatusAbsence.EN_ATTENTE).length,
    };
  });

  readonly selectedMember = computed(() => {
    const memberId = this.selectedMemberId();
    if (!memberId) {
      return null;
    }

    return this.teamMembers().find((member) => member.id === memberId) ?? null;
  });

  readonly selectedMemberAbsences = computed(() => {
    const memberId = this.selectedMemberId();
    if (!memberId) {
      return [];
    }

    return this.teamAbsences()
      .filter((absence) => absence.user?.id === memberId)
      .sort((left, right) => right.dateStart.localeCompare(left.dateStart));
  });

  readonly selectedMemberStats = computed(() => {
    const absences = this.selectedMemberAbsences();
    return {
      total: absences.length,
      validated: absences.filter((absence) => absence.status === StatusAbsence.VALIDE).length,
      pending: absences.filter((absence) => absence.status === StatusAbsence.EN_ATTENTE).length,
      refused: absences.filter((absence) => absence.status === StatusAbsence.REFUSE).length,
    };
  });

  getInitials(user?: UserResponse | null): string {
    const first = user?.firstName?.charAt(0) ?? '';
    const last = user?.lastName?.charAt(0) ?? '';
    return `${first}${last}` || '?';
  }

  selectMember(member: UserResponse): void {
    this.selectedMemberId.set(member.id);
  }

  clearSelectedMember(): void {
    this.selectedMemberId.set(null);
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return '—';
    }

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

  supervisorLabel(member?: UserResponse | null): string {
    if (!member?.superviseur) {
      return '—';
    }

    return `${member.superviseur.firstName} ${member.superviseur.lastName}`;
  }

  private showToast(message: string, type: ToastType = 'success'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 3000);
  }
}
