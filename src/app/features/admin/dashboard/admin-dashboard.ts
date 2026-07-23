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
import { UserService } from '../../../core/services/user.service';
import { UserResponse } from '../../../core/models/user-response';
import { Role } from '../../../core/models/role';
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
  selectedUser = signal<UserResponse | null>(null);
  selectedSupervisor = signal<UserResponse | null>(null);
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
      { label: 'Employés', value: s.employes, color: '#2563eb' },
      { label: 'Superviseurs', value: s.superviseurs, color: '#9333ea' },
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
        return '#9333ea';
      case Role.EMPLOYE:
        return '#2563eb';
      default:
        return '#666';
    }
  }

  getRoleBg(role: Role): string {
    switch (role) {
      case Role.ADMIN:
        return 'rgba(164, 24, 42, 0.1)';
      case Role.SUPERVISEUR:
        return 'rgba(147, 51, 234, 0.1)';
      case Role.EMPLOYE:
        return 'rgba(37, 99, 235, 0.1)';
      default:
        return 'rgba(0,0,0,0.05)';
    }
  }

  getInitials(user: UserResponse): string {
    return (user.firstName[0] + user.lastName[0]).toUpperCase();
  }

  getAvatarColor(user: UserResponse): string {
    const colors = ['#a4182a', '#2563eb', '#9333ea', '#16a34a', '#d97706', '#0891b2'];
    return colors[user.id % colors.length];
  }
}