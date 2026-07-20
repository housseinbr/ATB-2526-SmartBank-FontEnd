import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { UserResponse } from '../../core/models/user-response';
import { Role } from '../../core/models/role';
import { Icon } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private authService = inject(AuthService);
  private userService = inject(UserService);

  user = signal<UserResponse | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  saving = signal(false);
  saveSuccess = signal(false);

  // Mode édition
  editMode = signal(false);
  editForm = signal<Partial<UserResponse>>({});

  currentUser = computed(() => this.authService.currentUser());

  get initials(): string {
    const u = this.user();
    if (!u?.firstName || !u?.lastName) return '??';
    return (u.firstName[0] + u.lastName[0]).toUpperCase();
  }

  get fullName(): string {
    const u = this.user();
    if (!u?.firstName || !u?.lastName) return 'Utilisateur';
    return `${u.firstName} ${u.lastName}`;
  }

  get roleLabel(): string {
    const u = this.user();
    if (!u?.role) return '';
    switch (u.role) {
      case Role.ADMIN: return 'Administrateur';
      case Role.SUPERVISEUR: return 'Superviseur';
      case Role.EMPLOYE: return 'Employé';
      default: return u.role;
    }
  }

  get roleColor(): string {
    const u = this.user();
    switch (u?.role) {
      case Role.ADMIN: return '#ef4444';
      case Role.SUPERVISEUR: return '#f59e0b';
      case Role.EMPLOYE: return '#10b981';
      default: return '#6b7280';
    }
  }

  get supervisorName(): string {
    const s = this.user()?.superviseur;
    if (!s) return 'Aucun';
    return `${s.firstName} ${s.lastName}`;
  }

  constructor() {
    this.loadUser();
  }

  loadUser() {
    const currentUser = this.authService.currentUser();
    if (!currentUser?.id) {
      this.error.set('Utilisateur non connecté');
      return;
    }
    this.loading.set(true);
    this.userService
      .getUserById(currentUser.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (u) => {
          this.user.set(u);
          this.error.set(null);
        },
        error: (err) => {
          this.error.set('Erreur lors du chargement du profil');
          console.error(err);
        },
      });
  }

  // ===== ÉDITION =====
  startEdit() {
    const u = this.user();
    if (!u) return;
    this.editForm.set({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      numTel: u.numTel,
      numFax: u.numFax,
      useName: u.useName,
    });
    this.editMode.set(true);
    this.saveSuccess.set(false);
  }

  cancelEdit() {
    this.editMode.set(false);
    this.editForm.set({});
    this.saveSuccess.set(false);
  }

  saveEdit() {
    const u = this.user();
    if (!u?.id) return;

    this.saving.set(true);
    this.saveSuccess.set(false);

    this.userService.updateUser(u.id, this.editForm()).subscribe({
      next: (updated) => {
        this.user.set(updated);
        this.editMode.set(false);
        this.saving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set('Erreur lors de la mise à jour');
        console.error(err);
      },
    });
  }

  updateField(field: keyof UserResponse, value: any) {
    this.editForm.update((prev) => ({ ...prev, [field]: value }));
  }

  // ===== MOT DE PASSE =====
  showPasswordModal = signal(false);
  passwordForm = signal({ current: '', new: '', confirm: '' });
  passwordError = signal<string | null>(null);

  openPasswordModal() {
    this.showPasswordModal.set(true);
    this.passwordForm.set({ current: '', new: '', confirm: '' });
    this.passwordError.set(null);
  }

  closePasswordModal() {
    this.showPasswordModal.set(false);
  }

  changePassword() {
    const u = this.user();
    const form = this.passwordForm();
    if (!u?.id) return;

    if (form.new !== form.confirm) {
      this.passwordError.set('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.new.length < 6) {
      this.passwordError.set('Le mot de passe doit faire au moins 6 caractères');
      return;
    }

    this.userService.changePassword(u.id, form.new).subscribe({
      next: () => {
        this.closePasswordModal();
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: (err) => {
        this.passwordError.set('Erreur lors du changement de mot de passe');
        console.error(err);
      },
    });
  }
}
