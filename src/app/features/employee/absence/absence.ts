import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Toast, ToastType } from '../../../shared/components/toast/toast';
import { AlertComponent } from '../../../shared/components/alert/alert';
import { AbsenceApiService } from '../../../core/services/absence.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Absence,
  StatusAbsence,
  TypeAbsence,
  DemiJournee,
  TYPE_ABSENCE_LABELS,
  DEMI_JOURNEE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '../../../core/models/absence';

@Component({
  selector: 'app-mes-absences',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Toast, AlertComponent],
  templateUrl: './absence.html',
  styleUrl: './absence.css',
})
export class MesAbsences {
  absences = signal<Absence[]>([]);
  loading = signal(false);

  // form modal
  showForm = signal(false);
  editingId = signal<number | null>(null);

  // toast
  toastVisible = signal(false);
  toastMessage = signal('');
  toastType = signal<ToastType>('success');

  // alert (confirmation d'annulation)
  showCancelAlert = signal(false);
  pendingCancelId = signal<number | null>(null);

  typeOptions = Object.values(TypeAbsence);
  demiOptions = Object.values(DemiJournee);
  typeLabels = TYPE_ABSENCE_LABELS;
  demiLabels = DEMI_JOURNEE_LABELS;
  statusLabels = STATUS_LABELS;
  statusColors = STATUS_COLORS;

  form: FormGroup;

  constructor(private fb: FormBuilder, private api: AbsenceApiService, private authService: AuthService) {
    // Le formulaire est construit ici (et pas en propriété de classe) car
    // les initialiseurs de propriétés s'exécutent avant le corps du
    // constructeur : "this.fb" ne serait pas encore assigné sinon.
    this.form = this.fb.group({
      type: [null as TypeAbsence | null, Validators.required],
      dateStart: ['', Validators.required],
      dateEnd: ['', Validators.required],
      demiJournee: [null as DemiJournee | null],
      comment: [''],
    });

    this.load();
  }

  load() {
    if (!this.authService.getToken()) {
      this.loading.set(false);
      this.notify('Session expirée ou absente, veuillez vous reconnecter', 'error');
      return;
    }

    this.loading.set(true);
    this.api.getAll().subscribe({
      next: (data) => {
        this.absences.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notify('Erreur lors du chargement des absences', 'error');
      },
    });
  }

  openCreate() {
    this.editingId.set(null);
    this.form.reset({ type: null, dateStart: '', dateEnd: '', demiJournee: null, comment: '' });
    this.showForm.set(true);
  }

  openEdit(absence: Absence) {
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

  closeForm() {
    this.showForm.set(false);
  }

  submitForm() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const dateStart: string = value.dateStart ?? '';
    const dateEnd: string = value.dateEnd ?? '';

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
      status: StatusAbsence.EN_ATTENTE,
    };

    const id = this.editingId();
    const request = id ? this.api.update(id, payload) : this.api.create(payload);

    request.subscribe({
      next: () => {
        this.showForm.set(false);
        this.notify(id ? 'Demande modifiée avec succès' : 'Demande envoyée avec succès', 'success');
        this.load();
      },
      error: () => this.notify("Une erreur est survenue, veuillez réessayer", 'error'),
    });
  }

  askCancel(absence: Absence) {
    if (absence.status !== StatusAbsence.EN_ATTENTE) {
      this.notify('Seule une demande en attente peut être annulée', 'error');
      return;
    }
    this.pendingCancelId.set(absence.idAbcance ?? null);
    this.showCancelAlert.set(true);
  }

  confirmCancel() {
    const id = this.pendingCancelId();
    this.showCancelAlert.set(false);
    if (!id) return;

    this.api.delete(id).subscribe({
      next: () => {
        this.notify('Demande annulée', 'success');
        this.load();
      },
      error: () => this.notify("Erreur lors de l'annulation", 'error'),
    });
  }

  cancelDialogClosed() {
    this.showCancelAlert.set(false);
    this.pendingCancelId.set(null);
  }

  private notify(message: string, type: ToastType) {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 3000);
  }
}
