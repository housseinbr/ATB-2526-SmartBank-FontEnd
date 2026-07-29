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
      
    ],
  },
  [Role.SUPERVISEUR]: {
    brandLabel: 'Espace Superviseur',
    items: [
      { label: 'Mon équipe', route: '/dashboard/superviseur/team', icon: 'users' },
      { label: 'Demandes', route: '/dashboard/superviseur/demandes', icon: 'inbox' },
      { label: 'Calendrier', route: '/dashboard/superviseur/calendrier', icon: 'calendar' },
      { label: 'Mes absences', route: '/dashboard/absences', icon: 'calendar' },
    ],
  },
  [Role.EMPLOYE]: {
    brandLabel: 'Espace Employé',
    items: [
      { label: 'Mes demandes', route: '/dashboard/employe', icon: 'inbox' },
      { label: 'Mes absences', route: '/dashboard/absences', icon: 'calendar' },
      
    ],
  },
};
