import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Icon } from '../../../shared/components/icon/icon';
import { Toast, ToastType } from '../../../shared/components/toast/toast';
import { AlertComponent } from '../../../shared/components/alert/alert';
import { AbsenceApiService } from '../../../core/services/absence.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import {
  Absence,
  HistorySold,
  StatusAbsence,
  TypeAbsence,
  DemiJournee,
  TYPE_ABSENCE_LABELS,
  DEMI_JOURNEE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '../../../core/models/absence';
import { UserResponse } from '../../../core/models/user-response';

@Component({
  selector: 'app-mes-absences',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Toast, AlertComponent, Icon],
  templateUrl: './absence.html',
  styleUrl: './absence.css',
})
export class MesAbsences implements OnInit {
  readonly StatusAbsence = StatusAbsence;
  readonly TypeAbsence = TypeAbsence;
  readonly DemiJournee = DemiJournee;

  absences = signal<Absence[]>([]);
  history = signal<HistorySold[]>([]);
  currentUser = signal<UserResponse | null>(null);
  loading = signal(false);

  showForm = signal(false);
  editingId = signal<number | null>(null);
  showCancelAlert = signal(false);
  pendingCancelId = signal<number | null>(null);

  toastVisible = signal(false);
  toastMessage = signal('');
  toastType = signal<ToastType>('success');

  typeOptions = Object.values(TypeAbsence);
  demiOptions = Object.values(DemiJournee);
  typeLabels = TYPE_ABSENCE_LABELS;
  demiLabels = DEMI_JOURNEE_LABELS;
  statusLabels = STATUS_LABELS;
  statusColors = STATUS_COLORS;

  summaryCards = computed(() => [
    {
      label: 'Solde disponible',
      value: this.balance.toFixed(2),
      hint: 'jours restants',
      tone: 'slate',
    },
    {
      label: 'Demandes totales',
      value: String(this.absences().length),
      hint: 'historique personnel',
      tone: 'slate',
    },
    {
      label: 'En attente',
      value: String(this.absences().filter((absence) => absence.status === StatusAbsence.EN_ATTENTE).length),
      hint: 'à traiter',
      tone: 'amber',
    },
    {
      label: 'Validées',
      value: String(this.absences().filter((absence) => absence.status === StatusAbsence.VALIDE).length),
      hint: 'approuvées',
      tone: 'green',
    },
  ]);

  requestTimeline = computed(() =>
    [...this.absences()].sort((left, right) => right.dateStart.localeCompare(left.dateStart))
  );

  recentHistory = computed(() =>
    [...this.history()].sort((left, right) => right.dateAction.localeCompare(left.dateAction))
  );

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: AbsenceApiService,
    private authService: AuthService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      type: [null as TypeAbsence | null, Validators.required],
      dateStart: ['', Validators.required],
      dateEnd: ['', Validators.required],
      demiJournee: [null as DemiJournee | null],
      comment: [''],
    }, { validators: [this.dateOrderValidator(), this.balanceLimitValidator()] });
  }

  ngOnInit(): void {
    this.load();
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('ai') !== '1') return;
      this.editingId.set(null);
      this.form.reset({
        type: params.get('type') || null,
        dateStart: params.get('dateStart') || '',
        dateEnd: params.get('dateEnd') || '',
        demiJournee: null,
        comment: 'Demande préparée depuis l’assistant IA',
      });
      this.showForm.set(true);
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    });
  }

  load(): void {
    const sessionUser = this.authService.currentUser();
    if (!sessionUser?.id || !this.authService.getToken()) {
      this.notify('Session expirée ou absente, veuillez vous reconnecter', 'error');
      return;
    }

    this.loading.set(true);
    this.userService.getUserById(sessionUser.id).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.form.updateValueAndValidity({ emitEvent: false });
      },
      error: () => this.notify('Impossible de charger votre solde', 'error'),
    });

    this.api.getMine().subscribe({
      next: (data) => this.absences.set(data),
      error: () => this.notify('Erreur lors du chargement des absences', 'error'),
    });

    this.api.getMineHistory().subscribe({
      next: (data) => this.history.set(data),
      error: () => this.notify("Erreur lors du chargement de l'historique", 'error'),
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ type: null, dateStart: '', dateEnd: '', demiJournee: null, comment: '' });
    this.showForm.set(true);
  }

  openEdit(absence: Absence): void {
    if (absence.status !== StatusAbsence.EN_ATTENTE) {
      this.notify('Seule une demande en attente peut être modifiée', 'error');
      return;
    }

    this.editingId.set(absence.idAbcance ?? null);
    this.form.reset({
      type: absence.type,
      dateStart: absence.dateStart,
      dateEnd: absence.dateEnd,
      demiJournee: absence.demiJournee ?? null,
      comment: absence.comment ?? '',
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  submitForm(): void {
    const value = this.form.getRawValue();
    if (!value.type || !value.dateStart || !value.dateEnd) {
      this.form.markAllAsTouched();
      this.notify('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    const dateStart = value.dateStart ?? '';
    const dateEnd = value.dateEnd ?? '';

    if (this.form.errors?.['dateOrder']) {
      this.notify('La date de fin ne peut pas être avant la date de début', 'error');
      return;
    }

    if (this.form.errors?.['insufficientBalance']) {
      const requestedDays = this.form.errors['insufficientBalance'].requestedDays as number;
      this.notify(
        `Solde insuffisant: cette demande nécessite ${requestedDays.toFixed(2)} jour(s), mais votre solde actuel est de ${this.balance.toFixed(2)}.`,
        'error'
      );
      return;
    }

    const payload: Absence = {
      type: value.type as TypeAbsence,
      dateStart,
      dateEnd,
      demiJournee: value.demiJournee,
      comment: value.comment ?? '',
    };

    const id = this.editingId();
    const request = id ? this.api.update(id, payload) : this.api.create(payload);

    request.subscribe({
      next: () => {
        this.showForm.set(false);
        this.notify(id ? 'Demande modifiée avec succès' : 'Demande envoyée avec succès', 'success');
        this.load();
      },
      error: (error) => {
        const message = error?.error?.message || error?.message || 'Une erreur est survenue, veuillez réessayer';
        this.notify(message, 'error');
      },
    });
  }

  askCancel(absence: Absence): void {
    if (absence.status !== StatusAbsence.EN_ATTENTE) {
      this.notify('Seule une demande en attente peut être annulée', 'error');
      return;
    }

    this.pendingCancelId.set(absence.idAbcance ?? null);
    this.showCancelAlert.set(true);
  }

  confirmCancel(): void {
    const id = this.pendingCancelId();
    this.showCancelAlert.set(false);
    if (!id) {
      return;
    }

    this.api.delete(id).subscribe({
      next: () => {
        this.notify('Demande annulée', 'success');
        this.load();
      },
      error: () => this.notify("Erreur lors de l'annulation", 'error'),
    });
  }

  cancelDialogClosed(): void {
    this.showCancelAlert.set(false);
    this.pendingCancelId.set(null);
  }

  get balance(): number {
    return this.currentUser()?.solde ?? 22;
  }

  get balanceProgress(): number {
    return Math.min(100, Math.max(0, (this.balance / 22) * 100));
  }

  get requestedDaysPreview(): number {
    const value = this.form.getRawValue();
    return this.calculateRequestedDays(value.dateStart ?? '', value.dateEnd ?? '', value.demiJournee ?? null);
  }

  get isBalanceInsufficient(): boolean {
    const value = this.form.getRawValue();
    if (!value.dateStart || !value.dateEnd) {
      return false;
    }

    return this.calculateRequestedDays(value.dateStart, value.dateEnd, value.demiJournee ?? null) > this.balance;
  }

  get currentUserLabel(): string {
    const current = this.currentUser();
    if (!current) return 'Collaborateur';
    return `${current.firstName ?? ''} ${current.lastName ?? ''}`.trim() || 'Collaborateur';
  }

  formatDate(dateValue?: string | null): string {
    if (!dateValue) {
      return '—';
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  duration(absence: Absence): string {
    const start = new Date(absence.dateStart);
    const end = new Date(absence.dateEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return '—';
    }

    const diffInDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    return diffInDays === 1 ? '1 jour' : `${diffInDays} jours`;
  }

  private calculateRequestedDays(dateStart: string, dateEnd: string, demiJournee: DemiJournee | null): number {
    if (!dateStart || !dateEnd) {
      return 0;
    }

    const start = new Date(dateStart);
    const end = new Date(dateEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 0;
    }

    const diffInDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    if (diffInDays === 1 && demiJournee) {
      return 0.5;
    }

    return diffInDays;
  }

  signedBalance(movement: HistorySold): string {
    const delta = movement.soldeAfter - movement.soldeBefore;
    const prefix = delta > 0 ? '+' : '';
    return `${prefix}${delta.toFixed(2)} j`;
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

  private notify(message: string, type: ToastType): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 3000);
  }

  private dateOrderValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const dateStart = control.get('dateStart')?.value as string | null;
      const dateEnd = control.get('dateEnd')?.value as string | null;

      if (!dateStart || !dateEnd) {
        return null;
      }

      return dateEnd < dateStart ? { dateOrder: true } : null;
    };
  }

  private balanceLimitValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const dateStart = control.get('dateStart')?.value as string | null;
      const dateEnd = control.get('dateEnd')?.value as string | null;
      const demiJournee = control.get('demiJournee')?.value as DemiJournee | null;

      if (!dateStart || !dateEnd) {
        return null;
      }

      const requestedDays = this.calculateRequestedDays(dateStart, dateEnd, demiJournee);
      return requestedDays > this.balance
        ? { insufficientBalance: { requestedDays, balance: this.balance } }
        : null;
    };
  }
}
