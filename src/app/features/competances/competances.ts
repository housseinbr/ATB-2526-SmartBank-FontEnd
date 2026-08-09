import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { CompetanceService } from '../../core/services/competance.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { Competance } from '../../core/models/competance';
import { UserResponse } from '../../core/models/user-response';
import { Toast, ToastType } from '../../shared/components/toast/toast';
import { Icon } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-competances-page',
  standalone: true,
  imports: [CommonModule, Toast, Icon],
  templateUrl: './competances.html',
  styleUrl: './competances.css',
})
export class CompetancesPage implements OnInit {
  private readonly competanceService = inject(CompetanceService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly competances = signal<Competance[]>([]);
  readonly user = signal<UserResponse | null>(null);
  readonly isAdminView = signal(false);

  readonly toastMessage = signal('');
  readonly toastType = signal<ToastType>('success');
  readonly toastVisible = signal(false);

  readonly summary = computed(() => {
    const items = this.competances();
    const domains = new Set(items.map((item) => item.formation?.domain).filter(Boolean));
    return {
      total: items.length,
      domains: domains.size,
      formations: items.map((item) => item.formation?.title).filter(Boolean).length,
    };
  });

  ngOnInit(): void {
    const userIdParam = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isFinite(userIdParam) && userIdParam > 0) {
      this.isAdminView.set(true);
      this.loadForUser(userIdParam);
      return;
    }

    const currentUser = this.authService.currentUser();
    if (!currentUser?.id) {
      this.showToast('Session introuvable', 'error');
      return;
    }

    this.user.set({
      id: currentUser.id,
      cin: '',
      firstName: currentUser.firstName ?? '',
      lastName: currentUser.lastName ?? '',
      useName: currentUser.email ?? '',
      email: currentUser.email ?? '',
      numTel: '',
      numFax: '',
      birthday: '',
      sexe: '',
      role: currentUser.role,
      solde: 0,
      salaire: 0,
      idSuperviseur: null,
      actif: 'actif',
      superviseur: null,
    });
    this.loadMine();
  }

  loadMine(): void {
    this.loading.set(true);
    this.competanceService.getMine().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (items) => this.competances.set(items),
      error: () => this.showToast('Impossible de charger vos competences', 'error'),
    });
  }

  loadForUser(userId: number): void {
    this.loading.set(true);
    this.userService.getUserById(userId).subscribe({
      next: (user) => this.user.set(user),
      error: () => this.showToast('Utilisateur introuvable', 'error'),
    });

    this.competanceService.getForUser(userId).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (items) => this.competances.set(items),
      error: () => this.showToast('Impossible de charger les competences', 'error'),
    });
  }

  delete(item: Competance): void {
    if (!this.isAdminView()) {
      return;
    }

    this.competanceService.delete(item.idCompetance).subscribe({
      next: () => {
        this.showToast('Competence supprimee', 'success');
        const currentUser = this.user();
        if (currentUser?.id) {
          this.loadForUser(currentUser.id);
        }
      },
      error: (error) => this.showToast(error?.error?.message ?? 'Suppression impossible', 'error'),
    });
  }

  showToast(message: string, type: ToastType = 'success'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);
    window.setTimeout(() => this.toastVisible.set(false), 2800);
  }
}
