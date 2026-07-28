export enum TypeAbsence {
  CONGE = 'CONGE',
  PAYE = 'PAYE',
  NON_PAYE = 'NON_PAYE',
  MALADE = 'MALADE',
  AUTRE = 'AUTRE',
}

// ⚠️ À CONFIRMER : valeurs devinées, en attente du fichier DemiJournee.java réel
export enum DemiJournee {
  PART_APRES_MIDI = 'PART_APRES_MIDI',
  RETOUR_APRES_MIDI = 'RETOUR_APRES_MIDI',
}

export enum StatusAbsence {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE = 'VALIDE',
  REFUSE = 'REFUSE',
}

// Labels lisibles pour l'affichage (FR)
export const TYPE_ABSENCE_LABELS: Record<TypeAbsence, string> = {
  [TypeAbsence.CONGE]: 'Congé',
  [TypeAbsence.PAYE]: 'Congé payé',
  [TypeAbsence.NON_PAYE]: 'Congé sans solde',
  [TypeAbsence.MALADE]: 'Congé maladie',
  [TypeAbsence.AUTRE]: 'Autre',
};

export const DEMI_JOURNEE_LABELS: Record<DemiJournee, string> = {
  [DemiJournee.PART_APRES_MIDI]: 'Part après-midi',
  [DemiJournee.RETOUR_APRES_MIDI]: 'Retour après-midi',
};

export const STATUS_LABELS: Record<StatusAbsence, string> = {
  [StatusAbsence.EN_ATTENTE]: 'En attente',
  [StatusAbsence.VALIDE]: 'Approuvé',
  [StatusAbsence.REFUSE]: 'Rejeté',
};

// Couleur associée à chaque statut -> réutilise les classes .request-item__status--{color}
export const STATUS_COLORS: Record<StatusAbsence, 'green' | 'orange' | 'red'> = {
  [StatusAbsence.EN_ATTENTE]: 'orange',
  [StatusAbsence.VALIDE]: 'green',
  [StatusAbsence.REFUSE]: 'red',
};

export interface Absence {
  idAbcance?: number;
  user?: { idUser: number };
  type: TypeAbsence;
  comment?: string;
  dateStart: string; // format ISO 'YYYY-MM-DD'
  dateEnd: string;
  demiJournee?: DemiJournee | null;
  status?: StatusAbsence;
}

export interface AbsenceFormValue {
  type: TypeAbsence | null;
  dateStart: string;
  dateEnd: string;
  demiJournee: DemiJournee | null;
  comment: string;
}
