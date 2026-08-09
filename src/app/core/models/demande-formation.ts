import { Formation } from './formation';
import { UserResponse } from './user-response';

export enum DemandeFormationStatus {
  VALIDE = 'VALIDE',
  REFUSE = 'REFUSE',
  EN_ATTENTE = 'EN_ATTENTE',
}

export const DEMANDE_FORMATION_STATUS_LABELS: Record<DemandeFormationStatus, string> = {
  [DemandeFormationStatus.VALIDE]: 'Validée',
  [DemandeFormationStatus.REFUSE]: 'Refusée',
  [DemandeFormationStatus.EN_ATTENTE]: 'En attente',
};

export const DEMANDE_FORMATION_STATUS_COLORS: Record<DemandeFormationStatus, 'green' | 'orange' | 'red'> = {
  [DemandeFormationStatus.VALIDE]: 'green',
  [DemandeFormationStatus.REFUSE]: 'red',
  [DemandeFormationStatus.EN_ATTENTE]: 'orange',
};

export interface DemandeFormation {
  idDemandeFormation: number;
  formation: Formation;
  user: UserResponse;
  status: DemandeFormationStatus;
  date: string;
}
