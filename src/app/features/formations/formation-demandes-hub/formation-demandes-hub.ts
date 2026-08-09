import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models/role';
import { FormationRequests } from '../requests/formation-requests';
import { MyFormations } from '../my-formations/my-formations';

@Component({
  selector: 'app-formation-demandes-hub',
  standalone: true,
  imports: [CommonModule, FormationRequests, MyFormations],
  templateUrl: './formation-demandes-hub.html',
  styleUrl: './formation-demandes-hub.css',
})
export class FormationDemandesHub {
  private readonly authService = inject(AuthService);

  readonly role = computed(() => this.authService.currentUser()?.role ?? Role.EMPLOYE);
  readonly canManage = computed(() => this.role() === Role.ADMIN || this.role() === Role.SUPERVISEUR);
  readonly heroLabel = computed(() => (this.canManage() ? 'Validation' : 'Suivi personnel'));
  readonly heroSubtitle = computed(() =>
    this.canManage()
      ? 'Traitez les demandes de formation et gardez une lecture rapide de l’activité.'
      : 'Suivez vos demandes de formation et leur statut dans un espace clair.'
  );
}
