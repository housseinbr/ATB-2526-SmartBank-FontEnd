import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Toast, ToastType } from '../../../shared/components/toast/toast';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models/role';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, Toast],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = new FormBuilder();
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  serverError = signal<string | null>(null);

  toastVisible = signal(false);
  toastMessage = signal('');
  toastType = signal<ToastType>('success');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get email() {
    return this.form.controls.email;
  }

  get password() {
    return this.form.controls.password;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);

    this.authService
      .login({
        email: this.email.value!,
        password: this.password.value!,
      })
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.showToast('Connexion réussie.', 'success');
          this.redirectByRole(response.role);
        },
        error: (err) => {
          this.loading.set(false);
          const message =
            err.status === 401
              ? 'Email ou mot de passe incorrect.'
              : "Une erreur est survenue, réessayez plus tard.";
          this.serverError.set(message);
          this.showToast(message, 'error');
        },
      });
  }

  private redirectByRole(role: Role): void {
    switch (role) {
      case Role.ADMIN:
        this.router.navigate(['/dashboard/admin']);
        break;
      case Role.SUPERVISEUR: // adapte au nom exact de ton enum
        this.router.navigate(['/dashboard/superviseur']);
        break;
      default:
        this.router.navigate(['/dashboard/employe']);
    }
  }

  private showToast(message: string, type: ToastType): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);

    setTimeout(() => this.toastVisible.set(false), 3000);
  }
}