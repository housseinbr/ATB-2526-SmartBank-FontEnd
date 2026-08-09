import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { DemandeFormationService } from '../../../core/services/demande-formation.service';
import { DemandeFormation, DemandeFormationStatus, DEMANDE_FORMATION_STATUS_LABELS, DEMANDE_FORMATION_STATUS_COLORS } from '../../../core/models/demande-formation';
import { Toast, ToastType } from '../../../shared/components/toast/toast';
import { AlertComponent } from '../../../shared/components/alert/alert';
import { Icon } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-formation-requests',
  standalone: true,
  imports: [CommonModule, Toast, AlertComponent, Icon],
  templateUrl: './formation-requests.html',
  styleUrl: './formation-requests.css',
})
export class FormationRequests implements OnInit {
  private readonly demandeService = inject(DemandeFormationService);

  readonly requests = signal<DemandeFormation[]>([]);
  readonly loading = signal(false);
  readonly activeFilter = signal<'all' | DemandeFormationStatus.EN_ATTENTE | DemandeFormationStatus.VALIDE | DemandeFormationStatus.REFUSE>('all');
  readonly toastMessage = signal('');
  readonly toastType = signal<ToastType>('success');
  readonly toastVisible = signal(false);

  readonly alertVisible = signal(false);
  readonly alertTitle = signal('');
  readonly alertMessage = signal('');
  private pendingAction: (() => void) | null = null;

  readonly labels = DEMANDE_FORMATION_STATUS_LABELS;
  readonly colors = DEMANDE_FORMATION_STATUS_COLORS;
  readonly Status = DemandeFormationStatus;

  readonly filteredRequests = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'all') {
      return this.requests();
    }
    return this.requests().filter((item) => item.status === filter);
  });

  readonly stats = computed(() => {
    const requests = this.requests();
    return {
      total: requests.length,
      pending: requests.filter((item) => item.status === DemandeFormationStatus.EN_ATTENTE).length,
      valid: requests.filter((item) => item.status === DemandeFormationStatus.VALIDE).length,
      refused: requests.filter((item) => item.status === DemandeFormationStatus.REFUSE).length,
    };
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.demandeService.getManaged().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (items) => this.requests.set(items),
      error: () => this.showToast('Impossible de charger les demandes', 'error'),
    });
  }

  setFilter(filter: 'all' | DemandeFormationStatus.EN_ATTENTE | DemandeFormationStatus.VALIDE | DemandeFormationStatus.REFUSE): void {
    this.activeFilter.set(filter);
  }

  isPending(request: DemandeFormation): boolean {
    return request.status === DemandeFormationStatus.EN_ATTENTE;
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.trim()?.[0] ?? '';
    const last = lastName?.trim()?.[0] ?? '';
    return (first + last || '??').toUpperCase();
  }

  decide(request: DemandeFormation, decision: DemandeFormationStatus): void {
    const action = decision === DemandeFormationStatus.VALIDE ? 'valider' : 'refuser';
    this.alertTitle.set(`Confirmer ${action} ?`);
    this.alertMessage.set(`Voulez-vous ${action} la formation ${request.formation.title} pour ${request.user.firstName} ${request.user.lastName} ?`);
    this.alertVisible.set(true);
    this.pendingAction = () => {
      this.demandeService.decide(request.idDemandeFormation, decision).subscribe({
        next: () => {
          this.showToast(decision === DemandeFormationStatus.VALIDE ? 'Demande validée' : 'Demande refusée', 'success');
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

  showToast(message: string, type: ToastType = 'success'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);
    window.setTimeout(() => this.toastVisible.set(false), 2800);
  }

  dateLabel(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  }
}
