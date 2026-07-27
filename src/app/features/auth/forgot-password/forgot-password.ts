import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Toast, ToastType } from '../../../shared/components/toast/toast';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, Toast],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private fb = new FormBuilder();
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  serverError = signal<string | null>(null);
  sent = signal(false);

  toastVisible = signal(false);
  toastMessage = signal('');
  toastType = signal<ToastType>('success');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get email() {
    return this.form.controls.email;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);

    this.authService.forgotPassword(this.email.value!).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
        this.showToast('Un nouveau mot de passe vous a été envoyé par email.', 'success');
      },
      error: (err) => {
        this.loading.set(false);
        const message =
          err.status === 404
            ? 'Aucun compte associé à cet email.'
            : "Une erreur est survenue, réessayez plus tard.";
        this.serverError.set(message);
        this.showToast(message, 'error');
      },
    });
  }

  backToLogin(): void {
    this.router.navigate(['/login']);
  }

  private showToast(message: string, type: ToastType): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);

    setTimeout(() => this.toastVisible.set(false), 3000);
  }
}