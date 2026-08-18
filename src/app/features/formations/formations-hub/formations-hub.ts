import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models/role';
import { FormationsManagement } from '../management/formations-management';
import { FormationLab } from '../lab/formation-lab';
import { MyFormations } from '../my-formations/my-formations';

@Component({
  selector: 'app-formations-hub',
  standalone: true,
  imports: [CommonModule, FormationsManagement, FormationLab, MyFormations],
  templateUrl: './formations-hub.html',
  styleUrl: './formations-hub.css',
})
export class FormationsHub {
  private readonly authService = inject(AuthService);

  readonly role = computed(() => this.authService.currentUser()?.role ?? Role.EMPLOYE);
  readonly activeView = signal<'catalogue' | 'gestion' | 'suivi'>('catalogue');
  readonly canManage = computed(() => this.role() === Role.ADMIN || this.role() === Role.SUPERVISEUR);
  readonly canSelect = computed(() => this.role() === Role.EMPLOYE || this.role() === Role.SUPERVISEUR);
  readonly heroLabel = computed(() => (this.canManage() ? 'Gestion et choix' : 'Choix des formations'));
  readonly heroSubtitle = computed(() =>
    this.canManage()
      ? 'Gérez le catalogue et sélectionnez les formations qui vous intéressent.'
      : 'Consultez les formations disponibles et sélectionnez celles qui vous intéressent.'
  );

  showView(view: 'catalogue' | 'gestion' | 'suivi'): void {
    this.activeView.set(view);
  }
}
