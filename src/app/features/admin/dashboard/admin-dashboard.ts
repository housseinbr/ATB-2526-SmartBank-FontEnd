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
import { UserService } from '../../../core/services/user.service';
import { UserResponse } from '../../../core/models/user-response';
import { Role } from '../../../core/models/role';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Icon],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  readonly Role = Role;

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
      },
      error: err => {
        console.error('Toggle failed:', err);
        // Fallback: toggle locally if backend doesn't support it yet
        this.users.update(list =>
          list.map(u => (u.id === user.id ? { ...u, actif: newStatus } : u))
        );
      },
    });
  }

  onAddUser() {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    const user = this.addForm.value;
    this.userService.createUser(user).subscribe({
      next: () => {
        this.showAddModal.set(false);
        this.addForm.reset({ sexe: 'M', role: Role.EMPLOYE, solde: 30 });
        this.loadUsers();
      },
      error: err => {
        console.error('Create failed:', err);
        alert('Erreur lors de la création. Vérifiez que le backend est démarré.');
      },
    });
  }

  onEditUser() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const user = this.editForm.value;
    this.userService.updateUser(user.id, user).subscribe({
      next: () => {
        this.showEditModal.set(false);
        this.loadUsers();
      },
      error: err => {
        console.error('Update failed:', err);
        alert('Erreur lors de la mise à jour.');
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

  onDeleteUser(user: UserResponse) {
    if (!confirm(`Supprimer ${user.firstName} ${user.lastName} ?`)) return;
    this.userService.deleteUser(user.id).subscribe({
      next: () => this.loadUsers(),
      error: err => {
        console.error('Delete failed:', err);
        alert('Erreur lors de la suppression.');
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
