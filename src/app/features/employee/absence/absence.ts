import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
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
  imports: [CommonModule, ReactiveFormsModule, Toast, AlertComponent],
  templateUrl: './absence.html',
  styleUrl: './absence.css',
})
export class MesAbsences implements OnInit {
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

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: AbsenceApiService,
    private authService: AuthService,
    private userService: UserService
  ) {
    this.form = this.fb.group({
      type: [null as TypeAbsence | null, Validators.required],
      dateStart: ['', Validators.required],
      dateEnd: ['', Validators.required],
      demiJournee: [null as DemiJournee | null],
      comment: [''],
    });
  }

  ngOnInit(): void {
    this.load();
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
      next: (user) => this.currentUser.set(user),
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const dateStart = value.dateStart ?? '';
    const dateEnd = value.dateEnd ?? '';

    if (!dateStart || !dateEnd) {
      this.notify('Les dates de début et de fin sont obligatoires', 'error');
      return;
    }

    if (dateEnd < dateStart) {
      this.notify('La date de fin ne peut pas être avant la date de début', 'error');
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
      error: () => this.notify('Une erreur est survenue, veuillez réessayer', 'error'),
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

  private notify(message: string, type: ToastType): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 3000);
  }
}
