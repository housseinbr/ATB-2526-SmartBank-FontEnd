import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Icon } from '../../shared/components/icon/icon';
import { Toast, ToastType } from '../../shared/components/toast/toast';
import { AlertComponent } from '../../shared/components/alert/alert';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/models/role';
import { CommentItem } from '../../core/models/comment';
import { CommentService } from '../../core/services/comment.service';

@Component({
  selector: 'app-comments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Icon, Toast, AlertComponent],
  templateUrl: './comments-page.html',
  styleUrl: './comments-page.css',
})
export class CommentsPage implements OnInit {
  private authService = inject(AuthService);
  private commentService = inject(CommentService);

  readonly Role = Role;
  commentText = signal('');
  loading = signal(false);
  saving = signal(false);
  comments = signal<CommentItem[]>([]);

  toastMessage = signal('');
  toastType = signal<ToastType>('success');
  toastVisible = signal(false);

  alertVisible = signal(false);
  alertTitle = signal('');
  alertMessage = signal('');
  alertType = signal<'danger' | 'warning' | 'info'>('info');
  private alertResolve: ((value: boolean) => void) | null = null;

  suggestions = [
    'Demande de suivi sur dossier',
    'Besoin d’éclaircissement sur une procédure',
    'Signalement d’un point important',
    'Retour sur une situation interne',
    'Note métier à partager',
  ];

  currentRole = computed(() => this.authService.currentUser()?.role ?? null);
  stats = computed(() => {
    const comments = this.comments();
    const role = this.currentRole();
    return {
      total: comments.length,
      visibleToMe: role === Role.ADMIN ? comments.length : comments.length,
      canPublish: this.canComment() ? 1 : 0,
    };
  });

  ngOnInit(): void {
    this.loadComments();
  }

  private showToast(message: string, type: ToastType = 'success'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 3000);
  }

  showAlert(title: string, message: string, type: 'danger' | 'warning' | 'info' = 'info'): Promise<boolean> {
    this.alertTitle.set(title);
    this.alertMessage.set(message);
    this.alertType.set(type);
    this.alertVisible.set(true);
    return new Promise((resolve) => (this.alertResolve = resolve));
  }

  onAlertConfirm(): void {
    this.alertVisible.set(false);
    this.alertResolve?.(true);
    this.alertResolve = null;
  }

  onAlertCancel(): void {
    this.alertVisible.set(false);
    this.alertResolve?.(false);
    this.alertResolve = null;
  }

  canComment(): boolean {
    const role = this.currentRole();
    return role === Role.EMPLOYE || role === Role.SUPERVISEUR || role === Role.ADMIN;
  }

  canSeeAll(): boolean {
    return this.currentRole() === Role.ADMIN;
  }

  loadComments(): void {
    this.loading.set(true);
    const request$ = this.canSeeAll() ? this.commentService.loadAll() : this.commentService.loadMy();
    request$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (items) => this.comments.set(items),
      error: (error) => {
        console.error(error);
        this.showToast('Impossible de charger les commentaires.', 'error');
      },
    });
  }

  applySuggestion(value: string): void {
    this.commentText.set(value);
  }

  submit(): void {
    const text = this.commentText().trim();
    if (!text) {
      this.showToast('Écris un commentaire avant d’envoyer.', 'error');
      return;
    }

    this.saving.set(true);
    this.commentService.create(text).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.commentText.set('');
        this.showToast('Commentaire envoyé avec succès.', 'success');
        this.loadComments();
      },
      error: (error) => {
        console.error(error);
        this.showToast('Impossible d’envoyer le commentaire.', 'error');
      },
    });
  }

  async deleteDraft(): Promise<void> {
    const confirmed = await this.showAlert(
      'Effacer le commentaire ?',
      'Le texte actuel sera supprimé de la zone de saisie.',
      'warning'
    );
    if (confirmed) {
      this.commentText.set('');
      this.showToast('Texte effacé.', 'success');
    }
  }

  authorLabel(comment: CommentItem): string {
    return `${comment.userFirstName ?? '—'} ${comment.userLastName ?? ''}`.trim();
  }

  formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
  }
}
