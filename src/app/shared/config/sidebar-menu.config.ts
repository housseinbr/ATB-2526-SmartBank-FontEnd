import { Role } from '../../core/models/role';
import { IconName } from '../components/icon/icon';

export interface SidebarMenuItem {
  label: string;
  icon: IconName;
  route: string;
  /** Clé optionnelle pour lier un badge dynamique (ex: nombre de demandes en attente). */
  badgeKey?: 'notifications' | 'demandes';
}

export interface SidebarRoleConfig {
  brandLabel: string;
  items: SidebarMenuItem[];
}

export const SIDEBAR_CONFIG: Record<Role, SidebarRoleConfig> = {
  [Role.EMPLOYE]: {
    brandLabel: 'Espace Employé',
    items: [
      { label: 'Tableau de bord', icon: 'grid', route: '/dashboard/employe' },
      { label: 'Mon profil', icon: 'user', route: '/employe/profil' },
      { label: 'Faire une demande', icon: 'user-plus', route: '/employe/demandes/nouvelle' },
      { label: 'Mes absences', icon: 'calendar', route: '/employe/absences' },
      { label: 'Mes soldes', icon: 'bar-chart', route: '/employe/soldes' },
      { label: 'Mes compétences', icon: 'award', route: '/employe/competences' },
      { label: 'Formations', icon: 'book-open', route: '/employe/formations' },
      { label: 'Postes ouverts', icon: 'briefcase', route: '/employe/postes' },
      { label: 'Évaluations', icon: 'star', route: '/employe/evaluations' },
      { label: 'Notifications', icon: 'bell', route: '/employe/notifications', badgeKey: 'notifications' },
    ],
  },
  [Role.SUPERVISEUR]: {
    brandLabel: 'Espace Superviseur',
    items: [
      { label: 'Tableau de bord', icon: 'grid', route: '/dashboard/superviseur' },
      { label: 'Mon équipe', icon: 'users', route: '/superviseur/equipe' },
      { label: 'Demandes', icon: 'inbox', route: '/superviseur/demandes', badgeKey: 'demandes' },
      { label: 'Absences', icon: 'calendar', route: '/superviseur/absences' },
      { label: 'Évaluations', icon: 'star', route: '/superviseur/evaluations' },
      { label: 'Formations', icon: 'book-open', route: '/superviseur/formations' },
      { label: 'Mobilités', icon: 'briefcase', route: '/superviseur/mobilites' },
    ],
  },
  [Role.ADMIN]: {
    brandLabel: 'Espace Admin',
    items: [
      { label: 'Utilisateurs', icon: 'users', route: '/admin/utilisateurs' },
      { label: 'Sécurité', icon: 'shield', route: '/admin/securite' },
    ],
  },
};
