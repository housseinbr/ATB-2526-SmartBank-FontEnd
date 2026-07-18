import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Toast, ToastType } from '../../../shared/components/toast/toast';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, Toast],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = new FormBuilder();

  loading = signal(false);

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

    // TODO: remplacer par un vrai appel à AuthService.login(...)
    // AuthService.login(this.email.value!, this.password.value!).subscribe({
    //   next: () => this.showToast('Connexion réussie.', 'success'),
    //   error: () => this.showToast('Email ou mot de passe incorrect.', 'error'),
    // });

    setTimeout(() => {
      this.loading.set(false);
      this.showToast('Connexion réussie.', 'success');
    }, 600);
  }

  private showToast(message: string, type: ToastType): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);

    setTimeout(() => this.toastVisible.set(false), 3000);
  }
}