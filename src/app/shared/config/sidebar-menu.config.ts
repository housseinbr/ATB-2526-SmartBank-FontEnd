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
      { label: 'Utilisateurs', route: '/dashboard/admin/users', icon: 'users' },
      { label: 'Demandes', route: '/dashboard/admin/demandes', icon: 'inbox' },
      { label: 'Mobilité', route: '/dashboard/mobilite', icon: 'activity' },
      { label: 'Évaluations', route: '/dashboard/evaluations', icon: 'check' },
      { label: 'Reconnaissance', route: '/dashboard/reconnaissance', icon: 'award' },
      { label: 'Formations', route: '/dashboard/formations', icon: 'book-open' },
      { label: 'Demandes formations', route: '/dashboard/formation-demandes', icon: 'inbox' },
      { label: 'Competences', route: '/dashboard/competances', icon: 'award' },
      { label: 'Calendrier', route: '/dashboard/admin/calendrier', icon: 'calendar' },
      { label: 'Commentaires', route: '/dashboard/comments', icon: 'file-text' },
      { label: 'Assistant IA', route: '/dashboard/ai-assistant', icon: 'activity' },
    ],
  },
  [Role.SUPERVISEUR]: {
    brandLabel: 'Espace Superviseur',
    items: [
      { label: 'Mes donnees', route: '/dashboard/mes-donnees', icon: 'file-text' },
      { label: 'Mes absences', route: '/dashboard/absences', icon: 'calendar' },
      { label: 'Mon equipe', route: '/dashboard/superviseur/team', icon: 'users' },
      { label: 'Demandes', route: '/dashboard/superviseur/demandes', icon: 'inbox' },
      { label: 'Mobilité', route: '/dashboard/mobilite', icon: 'activity' },
      { label: 'Évaluations', route: '/dashboard/evaluations', icon: 'check' },
      { label: 'Reconnaissance', route: '/dashboard/reconnaissance', icon: 'award' },
      { label: 'Calendrier', route: '/dashboard/superviseur/calendrier', icon: 'calendar' },
      { label: 'Formations', route: '/dashboard/formations', icon: 'book-open' },
      { label: 'Demandes formations', route: '/dashboard/formation-demandes', icon: 'inbox' },
      { label: 'Competences', route: '/dashboard/competances', icon: 'award' },
      { label: 'Commentaires', route: '/dashboard/comments', icon: 'file-text' },
      { label: 'Assistant IA', route: '/dashboard/ai-assistant', icon: 'activity' },
    ],
  },
  [Role.EMPLOYE]: {
    brandLabel: 'Espace Employe',
    items: [
      { label: 'Mes demandes', route: '/dashboard/employe', icon: 'inbox' },
      { label: 'Mes donnees', route: '/dashboard/mes-donnees', icon: 'file-text' },
      { label: 'Mes absences', route: '/dashboard/absences', icon: 'calendar' },
      { label: 'Mobilité', route: '/dashboard/mobilite', icon: 'activity' },
      { label: 'Évaluations', route: '/dashboard/evaluations', icon: 'check' },
      { label: 'Reconnaissance', route: '/dashboard/reconnaissance', icon: 'award' },
      { label: 'Formations', route: '/dashboard/formations', icon: 'book-open' },
      { label: 'Demandes formations', route: '/dashboard/formation-demandes', icon: 'inbox' },
      { label: 'Competences', route: '/dashboard/competances', icon: 'award' },
      { label: 'Commentaires', route: '/dashboard/comments', icon: 'file-text' },
      { label: 'Assistant IA', route: '/dashboard/ai-assistant', icon: 'activity' },
    ],
  },
};


