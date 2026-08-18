import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AlertComponent } from '../../../shared/components/alert/alert';
import { Icon } from '../../../shared/components/icon/icon';
import { Toast, ToastType } from '../../../shared/components/toast/toast';
import { AuthService } from '../../../core/services/auth.service';
import { FormationService } from '../../../core/services/formation.service';
import { Formation, FormationFormValue } from '../../../core/models/formation';

@Component({
  selector: 'app-formations-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Toast, AlertComponent, Icon],
  templateUrl: './formations-management.html',
  styleUrl: './formations-management.css',
})
export class FormationsManagement implements OnInit {
  private readonly formationService = inject(FormationService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly formations = signal<Formation[]>([]);
  readonly loading = signal(false);
  readonly search = signal('');
  readonly selectedFormation = signal<Formation | null>(null);
  readonly formOpen = signal(false);
  readonly isSaving = signal(false);

  readonly toastMessage = signal('');
  readonly toastType = signal<ToastType>('success');
  readonly toastVisible = signal(false);

  readonly alertVisible = signal(false);
  readonly alertTitle = signal('');
  readonly alertMessage = signal('');
  private pendingDelete: Formation | null = null;

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    offreFormation: ['', Validators.required],
    domain: ['', Validators.required],
    theme: ['', Validators.required],
    duree: [1, [Validators.required, Validators.min(1)]],
    lieu: ['', Validators.required],
    unite: ['Jour', Validators.required],
  });

  readonly filteredFormations = computed(() => {
    const query = this.search().toLowerCase().trim();
    const items = this.formations();
    if (!query) {
      return items;
    }

    return items.filter((item) =>
      [item.title, item.domain, item.theme, item.lieu, item.unite, item.offreFormation]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  });

  readonly stats = computed(() => {
    const items = this.formations();
    const domains = new Set(items.map((item) => item.domain).filter(Boolean));
    return {
      total: items.length,
      domains: domains.size,
      duration: items.reduce((sum, item) => sum + (item.duree ?? 0), 0),
    };
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.formationService.getAll().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (data) => this.formations.set(data),
      error: () => this.showToast('Impossible de charger les formations', 'error'),
    });
  }

  startCreate(): void {
    this.selectedFormation.set(null);
    this.form.reset({
      title: '',
      offreFormation: '',
      domain: '',
      theme: '',
      duree: 1,
      lieu: '',
      unite: 'Jour',
    });
  }

  openCreate(): void {
    this.startCreate();
    this.formOpen.set(true);
  }

  closeForm(): void {
    if (!this.isSaving()) {
      this.formOpen.set(false);
    }
  }

  startEdit(item: Formation): void {
    this.selectedFormation.set(item);
    this.form.patchValue({
      title: item.title,
      offreFormation: item.offreFormation,
      domain: item.domain,
      theme: item.theme,
      duree: item.duree,
      lieu: item.lieu,
      unite: item.unite,
    });
    this.formOpen.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showToast('Veuillez remplir tous les champs requis', 'error');
      return;
    }

    const payload = this.form.getRawValue() as FormationFormValue;
    this.isSaving.set(true);

    const request = this.selectedFormation()
      ? this.formationService.update(this.selectedFormation()!.idFormation, payload)
      : this.formationService.create(payload);

    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.showToast(this.selectedFormation() ? 'Formation mise a jour' : 'Formation creee', 'success');
        this.startCreate();
        this.formOpen.set(false);
        this.load();
      },
      error: (error) => this.showToast(error?.error?.message ?? 'Action impossible', 'error'),
    });
  }

  async askDelete(item: Formation): Promise<void> {
    this.pendingDelete = item;
    this.alertTitle.set('Supprimer cette formation ?');
    this.alertMessage.set(`${item.title} sera retiree definitivement.`);
    this.alertVisible.set(true);
  }

  confirmDelete(): void {
    if (!this.pendingDelete) {
      this.alertVisible.set(false);
      return;
    }

    const item = this.pendingDelete;
    this.pendingDelete = null;
    this.alertVisible.set(false);

    this.formationService.delete(item.idFormation).subscribe({
      next: () => {
        if (this.selectedFormation()?.idFormation === item.idFormation) {
          this.startCreate();
        }
        this.showToast('Formation supprimee', 'success');
        this.load();
      },
      error: (error) => this.showToast(error?.error?.message ?? 'Suppression impossible', 'error'),
    });
  }

  cancelDelete(): void {
    this.pendingDelete = null;
    this.alertVisible.set(false);
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  showToast(message: string, type: ToastType = 'success'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);
    window.setTimeout(() => this.toastVisible.set(false), 2800);
  }

  currentRoleLabel(): string {
    return this.authService.currentUser()?.role ?? 'USER';
  }
}
