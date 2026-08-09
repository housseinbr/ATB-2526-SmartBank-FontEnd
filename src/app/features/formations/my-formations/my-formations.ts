import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { DemandeFormationService } from '../../../core/services/demande-formation.service';
import { DemandeFormation, DemandeFormationStatus, DEMANDE_FORMATION_STATUS_LABELS, DEMANDE_FORMATION_STATUS_COLORS } from '../../../core/models/demande-formation';
import { Toast, ToastType } from '../../../shared/components/toast/toast';

@Component({
  selector: 'app-my-formations',
  standalone: true,
  imports: [CommonModule, Toast],
  templateUrl: './my-formations.html',
  styleUrl: './my-formations.css',
})
export class MyFormations implements OnInit {
  private readonly demandeService = inject(DemandeFormationService);

  readonly requests = signal<DemandeFormation[]>([]);
  readonly loading = signal(false);
  readonly toastMessage = signal('');
  readonly toastType = signal<ToastType>('success');
  readonly toastVisible = signal(false);

  readonly labels = DEMANDE_FORMATION_STATUS_LABELS;
  readonly colors = DEMANDE_FORMATION_STATUS_COLORS;
  readonly Status = DemandeFormationStatus;

  readonly grouped = computed(() => ({
    pending: this.requests().filter((item) => item.status === DemandeFormationStatus.EN_ATTENTE),
    accepted: this.requests().filter((item) => item.status === DemandeFormationStatus.VALIDE),
    refused: this.requests().filter((item) => item.status === DemandeFormationStatus.REFUSE),
  }));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.demandeService.getMine().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (items) => this.requests.set(items),
      error: () => this.showToast('Impossible de charger vos demandes', 'error'),
    });
  }

  showToast(message: string, type: ToastType = 'success'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);
    window.setTimeout(() => this.toastVisible.set(false), 2800);
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  }
}
