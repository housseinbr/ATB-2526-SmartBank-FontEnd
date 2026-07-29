import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { AbsenceApiService } from '../../../core/services/absence.service';
import { AuthService } from '../../../core/services/auth.service';
import { Toast, ToastType } from '../../../shared/components/toast/toast';
import { AlertComponent } from '../../../shared/components/alert/alert';
import { Absence, StatusAbsence, STATUS_COLORS, STATUS_LABELS, TYPE_ABSENCE_LABELS } from '../../../core/models/absence';

@Component({
  selector: 'app-supervisor-requests',
  standalone: true,
  imports: [CommonModule, Toast, AlertComponent],
  templateUrl: './supervisor-requests.html',
  styleUrl: './supervisor-requests.css',
})
export class SupervisorRequests implements OnInit {
  requests = signal<Absence[]>([]);
  loading = signal(false);
  statusFilter = signal<'ALL' | StatusAbsence>('ALL');

  toastMessage = signal('');
  toastType = signal<ToastType>('success');
  toastVisible = signal(false);

  alertVisible = signal(false);
  alertTitle = signal('');
  alertMessage = signal('');
  private pendingAction: (() => void) | null = null;

  readonly StatusAbsence = StatusAbsence;
  statusColors = STATUS_COLORS;
  statusLabels = STATUS_LABELS;
  typeLabels = TYPE_ABSENCE_LABELS;

  constructor(
    private absenceApi: AbsenceApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.authService.getToken()) {
      this.showToast('Session absente, reconnectez-vous', 'error');
      return;
    }

    this.loading.set(true);
    this.absenceApi.getTeamAbsences().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (data) => this.requests.set(data),
      error: () => this.showToast('Impossible de charger les demandes', 'error'),
    });
  }

  filteredRequests = computed(() => {
    const filter = this.statusFilter();
    return this.requests().filter((request) => filter === 'ALL' || request.status === filter);
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

  decide(request: Absence, decision: StatusAbsence): void {
    const action = decision === StatusAbsence.VALIDE ? 'approuver' : 'refuser';
    this.alertTitle.set(`Confirmer ${action} ?`);
    this.alertMessage.set(`Voulez-vous ${action} la demande de ${request.user?.firstName} ${request.user?.lastName} ?`);
    this.alertVisible.set(true);
    this.pendingAction = () => {
      this.absenceApi.decide(request.idAbcance!, decision).subscribe({
        next: () => {
          this.showToast(decision === StatusAbsence.VALIDE ? 'Demande approuvée' : 'Demande refusée', 'success');
          this.load();
        },
        error: (error) => this.showToast(error?.error?.message ?? 'Action impossible', 'error'),
      });
    };
  }

  onAlertConfirm(): void {
    this.alertVisible.set(false);
    this.pendingAction?.();
    this.pendingAction = null;
  }

  onAlertCancel(): void {
    this.alertVisible.set(false);
    this.pendingAction = null;
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0) ?? '';
    const last = lastName?.charAt(0) ?? '';
    return `${first}${last}` || '?';
  }

  isPending(request: Absence): boolean {
    return request.status === StatusAbsence.EN_ATTENTE;
  }

  private showToast(message: string, type: ToastType = 'success'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 3000);
  }
}
