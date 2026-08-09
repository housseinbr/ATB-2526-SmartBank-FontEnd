import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { Toast, ToastType } from '../../../shared/components/toast/toast';
import { Icon } from '../../../shared/components/icon/icon';
import { Formation } from '../../../core/models/formation';
import { DemandeFormation, DemandeFormationStatus } from '../../../core/models/demande-formation';
import { Competance } from '../../../core/models/competance';
import { FormationService } from '../../../core/services/formation.service';
import { DemandeFormationService } from '../../../core/services/demande-formation.service';
import { CompetanceService } from '../../../core/services/competance.service';

@Component({
  selector: 'app-formation-lab',
  standalone: true,
  imports: [CommonModule, Toast, Icon],
  templateUrl: './formation-lab.html',
  styleUrl: './formation-lab.css',
})
export class FormationLab implements OnInit {
  private readonly formationService = inject(FormationService);
  private readonly demandeService = inject(DemandeFormationService);
  private readonly competanceService = inject(CompetanceService);

  readonly formations = signal<Formation[]>([]);
  readonly requests = signal<DemandeFormation[]>([]);
  readonly competances = signal<Competance[]>([]);
  readonly loading = signal(false);
  readonly search = signal('');

  readonly toastMessage = signal('');
  readonly toastType = signal<ToastType>('success');
  readonly toastVisible = signal(false);

  readonly filteredFormations = computed(() => {
    const query = this.search().toLowerCase().trim();
    const requestedIds = new Set(
      this.requests()
        .filter((item) => item.status === DemandeFormationStatus.EN_ATTENTE || item.status === DemandeFormationStatus.VALIDE)
        .map((item) => item.formation?.idFormation)
    );
    const competenceIds = new Set(this.competances().map((item) => item.formation?.idFormation));

    return this.formations().filter((formation) => {
      const match =
        !query ||
        [formation.title, formation.domain, formation.theme, formation.lieu, formation.offreFormation]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));
      const alreadyUsed = requestedIds.has(formation.idFormation) || competenceIds.has(formation.idFormation);
      return match && !alreadyUsed;
    });
  });

  readonly stats = computed(() => ({
    total: this.formations().length,
    requested: this.requests().length,
    competencies: this.competances().length,
  }));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.formationService.getAll().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (formations) => this.formations.set(formations),
      error: () => this.showToast('Impossible de charger le catalogue', 'error'),
    });

    this.demandeService.getMine().subscribe({
      next: (requests) => this.requests.set(requests),
      error: () => this.showToast('Impossible de charger vos demandes', 'error'),
    });

    this.competanceService.getMine().subscribe({
      next: (items) => this.competances.set(items),
      error: () => this.showToast('Impossible de charger vos competences', 'error'),
    });
  }

  requestFormation(formation: Formation): void {
    this.demandeService.requestFormation(formation.idFormation).subscribe({
      next: () => {
        this.showToast('Demande envoyee', 'success');
        this.load();
      },
      error: (error) => this.showToast(error?.error?.message ?? 'Demande impossible', 'error'),
    });
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  canRequest(item: Formation): boolean {
    const requestedIds = new Set(
      this.requests()
        .filter((request) => request.status === DemandeFormationStatus.EN_ATTENTE || request.status === DemandeFormationStatus.VALIDE)
        .map((request) => request.formation?.idFormation)
    );
    const competenceIds = new Set(this.competances().map((itemCompetance) => itemCompetance.formation?.idFormation));
    return !requestedIds.has(item.idFormation) && !competenceIds.has(item.idFormation);
  }

  showToast(message: string, type: ToastType = 'success'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);
    window.setTimeout(() => this.toastVisible.set(false), 2800);
  }

  labelForStatus(status: DemandeFormationStatus): string {
    switch (status) {
      case DemandeFormationStatus.VALIDE:
        return 'Validee';
      case DemandeFormationStatus.REFUSE:
        return 'Refusee';
      default:
        return 'En attente';
    }
  }
}
