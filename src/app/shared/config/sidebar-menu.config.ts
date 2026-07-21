import { Role } from '../../core/models/role';

export interface MenuItem {
  label: string;
  route: string;
  icon: string;
  badgeKey?: 'notifications' | 'demandes';
}

export interface SidebarConfig {
  brandLabel: string;
  items: MenuItem[];
}

export const SIDEBAR_CONFIG: Record<Role, SidebarConfig> = {
  [Role.ADMIN]: {
    brandLabel: 'Espace Admin',
    items: [
      { label: 'Utilisateurs', route: '/dashboard/admin', icon: 'users' },
      { label: 'Mon Profil', route: '/dashboard/profile', icon: 'user' },
    ],
  },
  [Role.SUPERVISEUR]: {
    brandLabel: 'Espace Superviseur',
    items: [
      { label: 'Mon équipe', route: '/dashboard/superviseur', icon: 'users' },
      { label: 'Demandes', route: '/dashboard/superviseur', icon: 'inbox', badgeKey: 'demandes' },
      { label: 'Mon Profil', route: '/dashboard/profile', icon: 'user' },
    ],
  },
  [Role.EMPLOYE]: {
    brandLabel: 'Espace Employé',
    items: [
      { label: 'Mes demandes', route: '/dashboard/employe', icon: 'inbox' },
      { label: 'Mon Profil', route: '/dashboard/profile', icon: 'user' },
    ],
  },
};