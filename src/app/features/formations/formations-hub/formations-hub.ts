import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models/role';
import { FormationsManagement } from '../management/formations-management';
import { FormationLab } from '../lab/formation-lab';

@Component({
  selector: 'app-formations-hub',
  standalone: true,
  imports: [CommonModule, FormationsManagement, FormationLab],
  templateUrl: './formations-hub.html',
  styleUrl: './formations-hub.css',
})
export class FormationsHub {
  private readonly authService = inject(AuthService);

  readonly role = computed(() => this.authService.currentUser()?.role ?? Role.EMPLOYE);
  readonly canManage = computed(() => this.role() === Role.ADMIN || this.role() === Role.SUPERVISEUR);
  readonly heroLabel = computed(() => (this.canManage() ? 'Administration' : 'Choix des formations'));
  readonly heroSubtitle = computed(() =>
    this.canManage()
      ? 'Consultez et mettez à jour le catalogue des formations.'
      : 'Consultez les formations disponibles et sélectionnez celles qui vous intéressent.'
  );
}
