import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Icon } from '../../../shared/components/icon/icon';
import { Toast } from '../../../shared/components/toast/toast';
import { AlertComponent } from '../../../shared/components/alert/alert';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { ProfileDataService } from '../../../core/services/profile-data.service';
import { AbsenceApiService } from '../../../core/services/absence.service';
import { UserResponse } from '../../../core/models/user-response';
import { Role } from '../../../core/models/role';
import { UserProfileData } from '../../../core/models/profile-data';
import { HistorySold } from '../../../core/models/absence';
import { environment } from '../../../../environments/environment';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Icon, Toast, AlertComponent],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private userService = inject(UserService);
  private profileDataService = inject(ProfileDataService);
  private absenceApi = inject(AbsenceApiService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  readonly Role = Role;

  // Toast
  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');
  toastVisible = signal(false);
  private toastTimeout: any;

  // Alert (remplace confirm natif)
  alertVisible = signal(false);
  alertTitle = signal('');
  alertMessage = signal('');
  alertType = signal<'danger' | 'warning' | 'info'>('danger');
  private alertResolve: ((value: boolean) => void) | null = null;

  // Dropdown superviseur (row en cours d'édition)
  editingSupervisorRowId = signal<number | null>(null);

  users = signal<UserResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchQuery = signal('');
  roleFilter = signal<Role | 'ALL'>('ALL');
  showAddModal = signal(false);
  showViewModal = signal(false);
  showEditModal = signal(false);
  showSupervisorModal = signal(false);
  showHistoryModal = signal(false);
  selectedUser = signal<UserResponse | null>(null);
  selectedSupervisor = signal<UserResponse | null>(null);
  selectedHistoryUser = signal<UserResponse | null>(null);
  selectedHistory = signal<HistorySold[]>([]);
  addForm: FormGroup;
  editForm: FormGroup;

  constructor() {
    this.addForm = this.fb.group({
      cin: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      useName: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      numTel: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      numFax: [''],
      birthday: ['', Validators.required],
      sexe: ['M', Validators.required],
      role: [Role.EMPLOYE, Validators.required],
      salaire: [0, [Validators.required, Validators.min(0)]],
      solde: [30, [Validators.required, Validators.min(0)]],
    });

    this.editForm = this.fb.group({
      id: [0],
      cin: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      useName: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      numTel: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      numFax: [''],
      birthday: ['', Validators.required],
      sexe: ['M', Validators.required],
      role: [Role.EMPLOYE, Validators.required],
      salaire: [0, [Validators.required, Validators.min(0)]],
      solde: [30, [Validators.required, Validators.min(0)]],
      actif: ['actif'],
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  // Toast helper
  showToast(message: string, type: 'success' | 'error' = 'success', duration: number = 3000) {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);

    this.toastTimeout = setTimeout(() => {
      this.toastVisible.set(false);
    }, duration);
  }

  // Alert helper (remplace window.confirm)
  showAlert(title: string, message: string = '', type: 'danger' | 'warning' | 'info' = 'danger'): Promise<boolean> {
    return new Promise((resolve) => {
      this.alertTitle.set(title);
      this.alertMessage.set(message);
      this.alertType.set(type);
      this.alertVisible.set(true);
      this.alertResolve = resolve;
    });
  }

  onAlertConfirm() {
    this.alertVisible.set(false);
    if (this.alertResolve) {
      this.alertResolve(true);
      this.alertResolve = null;
    }
  }

  onAlertCancel() {
    this.alertVisible.set(false);
    if (this.alertResolve) {
      this.alertResolve(false);
      this.alertResolve = null;
    }
  }

  // Liste des superviseurs disponibles (tous les users avec role SUPERVISEUR)
  availableSupervisors = computed(() => {
    return this.users().filter(u => u.role === Role.SUPERVISEUR);
  });

  // Ouvrir le dropdown pour une ligne
  openSupervisorDropdown(userId: number) {
    this.editingSupervisorRowId.set(userId);
  }

  // Fermer le dropdown
  closeSupervisorDropdown() {
    this.editingSupervisorRowId.set(null);
  }

  onAssignSupervisor(user: UserResponse, supervisorId: string) {
  this.closeSupervisorDropdown();

  const isRemoving = supervisorId === '' || supervisorId === '0';
  
  const sup = isRemoving
    ? null
    : (this.availableSupervisors().find(s => s.id === Number(supervisorId)) ?? null);

  if (isRemoving && user.superviseur) {
    this.showAlert(
      'Retirer le superviseur ?',
      `Voulez-vous retirer ${user.superviseur.firstName} ${user.superviseur.lastName} comme superviseur de ${user.firstName} ${user.lastName} ?`,
      'warning'
    ).then(confirmed => {
      if (confirmed) {
        this.doAssignSupervisor(user, null);
      }
    });
    return;
  }

  this.doAssignSupervisor(user, sup);
}

// Méthode privée pour faire l'appel API
private doAssignSupervisor(user: UserResponse, sup: UserResponse | null) {
  const payload = sup ? sup.id : 0;

  this.userService.assignSuperviseur(user.id, payload).subscribe({
    next: () => {
      this.users.update(list =>
        list.map(u => {
          if (u.id !== user.id) return u;
          return {
            ...u,
            idSuperviseur: sup ? sup.id : null,
            superviseur: sup ? { ...sup } : null
          };
        })
      );
      
      this.showToast(
        sup
          ? `Superviseur ${sup.firstName} ${sup.lastName} assigné !`
          : 'Superviseur retiré !',
        'success'
      );
    },
    error: err => {
      console.error('Assign failed:', err);
      this.showToast('Erreur lors de l\'assignation.', 'error');
    },
  });
}

  // Liste des superviseurs disponibles pour un user (exclure lui-même)
  getAvailableSupervisorsFor(user: UserResponse): UserResponse[] {
    return this.availableSupervisors().filter(s => s.id !== user.id);
  }

  // Computed stats
  stats = computed(() => {
    const all = this.users();
    const total = all.length;
    const actifs = all.filter(u => u.actif === 'actif').length;
    const inactifs = all.filter(u => u.actif === 'inactif').length;
    const admins = all.filter(u => u.role === Role.ADMIN).length;
    const employes = all.filter(u => u.role === Role.EMPLOYE).length;
    const superviseurs = all.filter(u => u.role === Role.SUPERVISEUR).length;
    return {
      total,
      actifs,
      inactifs,
      admins,
      employes,
      superviseurs,
      tauxActif: total > 0 ? ((actifs / total) * 100).toFixed(1) : '0.0',
    };
  });

  // Chart data
  roleChartData = computed(() => {
    const s = this.stats();
    return [
      { label: 'Admins', value: s.admins, color: '#a4182a' },
      { label: 'Employés', value: s.employes, color: '#64748b' },
      { label: 'Superviseurs', value: s.superviseurs, color: '#16a34a' },
    ].filter(d => d.value > 0);
  });

  statusChartData = computed(() => {
    const s = this.stats();
    return [
      { label: 'Actifs', value: s.actifs, color: '#16a34a' },
      { label: 'Inactifs', value: s.inactifs, color: '#dc2626' },
    ].filter(d => d.value > 0);
  });

  salaryChartData = computed(() => {
    const all = this.users();
    const ranges = [
      { label: '< 1000', min: 0, max: 1000, count: 0 },
      { label: '1000-2000', min: 1000, max: 2000, count: 0 },
      { label: '2000-3000', min: 2000, max: 3000, count: 0 },
      { label: '> 3000', min: 3000, max: Infinity, count: 0 },
    ];
    all.forEach(u => {
      const r = ranges.find(r => u.salaire >= r.min && u.salaire < r.max);
      if (r) r.count++;
    });
    return ranges.filter(r => r.count > 0);
  });

  getPieOffset(data: { label: string; value: number; color: string }[], index: number): string {
    let offset = 25;
    for (let i = 0; i < index; i++) {
      offset -= data[i].value;
    }
    return String(offset);
  }

  // Filtered users
  filteredUsers = computed(() => {
    let result = this.users();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      result = result.filter(
        u =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.useName.toLowerCase().includes(q) ||
          u.cin.includes(q)
      );
    }
    const role = this.roleFilter();
    if (role !== 'ALL') {
      result = result.filter(u => u.role === role);
    }
    return result;
  });

  loadUsers() {
    this.loading.set(true);
    this.error.set(null);
    this.userService
      .getAllUsersWithSupervisors()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data: UserResponse[]) => this.users.set(data),
        error: (err: any) => {
          this.error.set('Impossible de charger les utilisateurs. Vérifiez que le backend est démarré.');
          this.showToast('Impossible de charger les utilisateurs.', 'error');
          console.error(err);
        },
      });
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onRoleFilter(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.roleFilter.set(value === 'ALL' ? 'ALL' : (value as Role));
  }

  onToggleActive(user: UserResponse) {
    const newStatus = user.actif === 'actif' ? 'inactif' : 'actif';
    this.userService.toggleActive(user.id, newStatus).subscribe({
      next: updated => {
        this.users.update(list =>
          list.map(u => (u.id === updated.id ? updated : u))
        );
        this.showToast(
          `Utilisateur ${newStatus === 'actif' ? 'activé' : 'désactivé'} avec succès !`,
          'success'
        );
      },
      error: err => {
        console.error('Toggle failed:', err);
        this.users.update(list =>
          list.map(u => (u.id === user.id ? { ...u, actif: newStatus } : u))
        );
        this.showToast(
          `Utilisateur ${newStatus === 'actif' ? 'activé' : 'désactivé'} avec succès !`,
          'success'
        );
      },
    });
  }

  onAddUser() {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      this.showToast('Veuillez remplir tous les champs requis correctement.', 'error');
      return;
    }
    const user = this.addForm.value;
    this.userService.createUser(user).subscribe({
      next: () => {
        this.showAddModal.set(false);
        this.addForm.reset({ sexe: 'M', role: Role.EMPLOYE, solde: 30 });
        this.loadUsers();
        this.showToast('Utilisateur ajouté avec succès !', 'success');
      },
      error: err => {
        console.error('Create failed:', err);
        this.showToast('Erreur lors de la création de l\'utilisateur.', 'error');
      },
    });
  }

  onEditUser() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.showToast('Veuillez corriger les erreurs du formulaire.', 'error');
      return;
    }
    const user = this.editForm.value;
    this.userService.updateUser(user.id, user).subscribe({
      next: () => {
        this.showEditModal.set(false);
        this.loadUsers();
        this.showToast('Modifications enregistrées avec succès !', 'success');
      },
      error: err => {
        console.error('Update failed:', err);
        this.showToast('Erreur lors de la mise à jour.', 'error');
      },
    });
  }

  openEditModal(user: UserResponse) {
    this.editForm.patchValue({
      id: user.id,
      cin: user.cin,
      useName: user.useName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      numTel: user.numTel,
      numFax: user.numFax,
      birthday: user.birthday,
      sexe: user.sexe,
      role: user.role,
      salaire: user.salaire,
      solde: user.solde,
      actif: user.actif,
    });
    this.selectedUser.set(user);
    this.showEditModal.set(true);
  }

  openViewModal(user: UserResponse) {
    this.selectedUser.set(user);
    this.showViewModal.set(true);
  }

  openUserData(user: UserResponse) {
    this.router.navigate(['/dashboard/admin/users', user.id, 'donnees']);
  }

  openUserDossier(user: UserResponse) {
    this.router.navigate(['/dashboard/admin/users', user.id, 'dossier']);
  }

  openHistoryModal(user: UserResponse) {
    this.selectedHistoryUser.set(user);
    this.showHistoryModal.set(true);
    this.absenceApi.getHistoryForUser(user.id).subscribe({
      next: (items) => this.selectedHistory.set(items),
      error: () => this.showToast('Impossible de charger l’historique.', 'error'),
    });
  }

  openCompetances(user: UserResponse) {
    this.router.navigate(['/dashboard/admin/users', user.id, 'competances']);
  }

  openSupervisorModal(supervisor: UserResponse | null) {
    if (supervisor) {
      this.selectedSupervisor.set(supervisor);
      this.showSupervisorModal.set(true);
    }
  }

  async onDeleteUser(user: UserResponse) {
    const confirmed = await this.showAlert(
      'Supprimer cet utilisateur ?',
      `Vous êtes sur le point de supprimer ${user.firstName} ${user.lastName}. Cette action est irréversible.`,
      'danger'
    );
    if (!confirmed) return;

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.loadUsers();
        this.showToast('Utilisateur supprimé avec succès !', 'success');
      },
      error: err => {
        console.error('Delete failed:', err);
        this.showToast('Erreur lors de la suppression.', 'error');
      },
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  getRoleColor(role: Role): string {
    switch (role) {
      case Role.ADMIN:
        return '#a4182a';
      case Role.SUPERVISEUR:
        return '#16a34a';
      case Role.EMPLOYE:
        return '#64748b';
      default:
        return '#666';
    }
  }

  getRoleBg(role: Role): string {
    switch (role) {
      case Role.ADMIN:
        return 'rgba(164, 24, 42, 0.1)';
      case Role.SUPERVISEUR:
        return 'rgba(34, 197, 94, 0.1)';
      case Role.EMPLOYE:
        return 'rgba(100, 116, 139, 0.1)';
      default:
        return 'rgba(0,0,0,0.05)';
    }
  }

  getInitials(user: UserResponse): string {
    return (user.firstName[0] + user.lastName[0]).toUpperCase();
  }

  getAvatarColor(user: UserResponse): string {
    const colors = ['#a4182a', '#64748b', '#16a34a', '#d97706', '#111827', '#b21f35'];
    return colors[user.id % colors.length];
  }

  formatHistoryDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  }

  exportUsersExcel(): void {
    const headers = [
      'ID',
      'CIN',
      'Nom',
      'Prénom',
      'Username',
      'Email',
      'Téléphone',
      'Date naissance',
      'Rôle',
      'Solde',
      'Salaire',
      'Superviseur',
      'Statut',
    ];

    const rows = this.filteredUsers().map((user) => [
      user.id,
      user.cin,
      user.lastName,
      user.firstName,
      user.useName,
      user.email,
      user.numTel,
      this.formatDate(user.birthday),
      user.role,
      user.solde,
      user.salaire,
      user.superviseur ? `${user.superviseur.firstName} ${user.superviseur.lastName}` : '',
      user.actif,
    ]);

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
            h1 { color: #a4182a; margin: 0 0 8px; }
            p { margin: 0 0 20px; color: #6b7280; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 10px 12px; text-align: left; font-size: 12px; }
            th { background: #f8fafc; color: #111827; }
          </style>
        </head>
        <body>
          <h1>Export des utilisateurs</h1>
          <p>Généré le ${new Date().toLocaleString('fr-FR')}</p>
          <table>
            <thead>
              <tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell ?? ''}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    this.downloadFile(url, `utilisateurs_${this.fileStamp()}.xls`);
  }

  exportUserProfilePdf(user: UserResponse): void {
    this.profileDataService.getProfileData(user.id).subscribe({
      next: (profile) => this.openProfilePrintWindow(user, profile),
      error: () => this.showToast('Impossible de charger le profil pour l’export PDF.', 'error'),
    });
  }

  private openProfilePrintWindow(user: UserResponse, profile: UserProfileData): void {
    const sections = [
      this.buildProfileSection('Adresse', profile.addresses.map((item) => ({
        label: `${item.country ?? '—'} / ${item.ville ?? '—'} / ${item.government ?? '—'}`,
        meta: 'Justificatif',
        image: this.documentUrl(item.documentLink),
      }))),
      this.buildProfileSection('Compte bancaire', profile.bankAccount ? [{
        label: `${profile.bankAccount.bankTitle ?? '—'} · ${profile.bankAccount.compte ?? '—'}`,
        meta: `${profile.bankAccount.nameBenifice ?? '—'} · ${profile.bankAccount.ville ?? '—'}`,
        image: this.documentUrl(profile.bankAccount.documentLink),
      }] : []),
      this.buildProfileSection('Situation familiale', profile.familySituation ? [{
        label: profile.familySituation.situation ?? '—',
        meta: profile.familySituation.documentUpload ?? 'Document',
        image: this.documentUrl(profile.familySituation.documentLink),
      }] : []),
      this.buildProfileSection('Données administratives', profile.administrativeData.map((item) => ({
        label: `${item.situationEmploye ?? '—'} · ${item.classification ?? '—'}`,
        meta: `${item.qualification ?? '—'} · ${this.formatDate(item.dateInscrit || '')}`,
        image: this.documentUrl(item.documentLink),
      }))),
      this.buildProfileSection('Personnes à charge', profile.dependents.map((item) => ({
        label: `${item.name ?? '—'} ${item.lastName ?? ''}`.trim(),
        meta: `${item.relation ?? '—'} · ${item.numTel ?? '—'}`,
      }))),
      this.buildProfileSection('Contacts urgents', profile.urgentContacts.map((item) => ({
        label: `${item.name ?? '—'} ${item.lastName ?? ''}`.trim(),
        meta: `${item.relation ?? '—'} · ${item.numTel ?? '—'}`,
      }))),
    ].join('');

    const popup = window.open('', '_blank', 'width=1200,height=900');
    if (!popup) {
      this.showToast('Impossible d’ouvrir la fenêtre PDF.', 'error');
      return;
    }

    popup.document.write(`
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Profil - ${user.firstName} ${user.lastName}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 28px; color: #111827; background: #f8fafc; }
            .page { max-width: 1100px; margin: 0 auto; background: #fff; border-radius: 20px; padding: 28px; box-shadow: 0 10px 35px rgba(15, 23, 42, 0.08); }
            .hero { display: flex; justify-content: space-between; gap: 20px; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 18px; margin-bottom: 24px; }
            .hero h1 { margin: 0; color: #a4182a; font-size: 28px; }
            .hero .meta { color: #6b7280; margin-top: 6px; }
            .badge { display: inline-block; margin-top: 10px; padding: 6px 12px; border-radius: 999px; background: #fce7f3; color: #a4182a; font-weight: 700; font-size: 12px; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
            .section { border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
            .section__head { padding: 14px 16px; background: linear-gradient(135deg, #fff7f8, #ffffff); border-bottom: 1px solid #e5e7eb; }
            .section__head h2 { margin: 0; font-size: 16px; color: #111827; }
            .section__body { padding: 14px 16px; display: grid; gap: 12px; }
            .item { padding: 12px; border-radius: 12px; background: #f8fafc; border: 1px solid #eef2f7; }
            .item h3 { margin: 0 0 4px; font-size: 14px; }
            .item .meta { color: #6b7280; font-size: 12px; margin-bottom: 10px; }
            .item img { width: 100%; max-height: 260px; object-fit: contain; border-radius: 10px; background: #fff; border: 1px solid #e5e7eb; }
            .full { grid-column: 1 / -1; }
            @media print { body { background: #fff; padding: 0; } .page { box-shadow: none; border-radius: 0; } }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="hero">
              <div>
                <h1>${user.firstName} ${user.lastName}</h1>
                <div class="meta">${user.useName} · ${user.email} · ${user.role}</div>
                <div class="badge">Profil complet utilisateur</div>
              </div>
              <div style="text-align:right">
                <div><strong>CIN:</strong> ${user.cin}</div>
                <div><strong>Téléphone:</strong> ${user.numTel}</div>
                <div><strong>Statut:</strong> ${user.actif}</div>
              </div>
            </div>
            <div class="grid">
              ${this.buildProfileStatCard('Solde', `${user.solde} j`)}
              ${this.buildProfileStatCard('Salaire', `${user.salaire.toLocaleString('fr-FR')} DT`)}
              ${this.buildProfileStatCard('Superviseur', user.superviseur ? `${user.superviseur.firstName} ${user.superviseur.lastName}` : 'Aucun')}
              ${this.buildProfileStatCard('Naissance', this.formatDate(user.birthday))}
              <div class="full">${sections}</div>
            </div>
          </div>
          <script>window.onload = () => { window.focus(); window.print(); };</script>
        </body>
      </html>
    `);
    popup.document.close();
  }

  private buildProfileSection(title: string, items: Array<{ label: string; meta?: string; image?: string | null }>): string {
    if (!items.length) {
      return '';
    }
    return `
      <section class="section">
        <div class="section__head"><h2>${title}</h2></div>
        <div class="section__body">
          ${items.map((item) => `
            <div class="item">
              <h3>${item.label}</h3>
              ${item.meta ? `<div class="meta">${item.meta}</div>` : ''}
              ${item.image ? `<img src="${item.image}" alt="${title}" />` : ''}
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  private buildProfileStatCard(title: string, value: string): string {
    return `
      <div class="item">
        <h3>${title}</h3>
        <div class="meta" style="font-size: 16px; color: #111827; font-weight: 700;">${value}</div>
      </div>
    `;
  }

  private documentUrl(pathValue?: string | null): string | null {
    if (!pathValue) return null;
    return `${environment.apiUrl}/documents/${encodeURIComponent(this.documentFileName(pathValue))}`;
  }

  private fileStamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  private documentFileName(pathValue: string): string {
    const normalized = pathValue.replace(/\\/g, '/');
    return normalized.split('/').pop() || pathValue;
  }

  private downloadFile(url: string, fileName: string): void {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
