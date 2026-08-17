import { UserResponse } from './user-response';

export enum RequestDocumentType {
  BADGE = 'BADGE',
  ATTESTATION = 'ATTESTATION',
}

export enum RequestStatus {
  VALIDE = 'VALIDE',
  REFUSE = 'REFUSE',
  EN_ATTENTE = 'EN_ATTENTE',
}

export interface RhRequest {
  idDemande: number;
  user: UserResponse;
  type: RequestDocumentType;
  status: RequestStatus;
  date: string;
}

export interface MobiliteItem {
  idMobilter: number;
  pays?: string | null;
  societe?: string | null;
  domain?: string | null;
  emploi?: string | null;
  unite?: number | null;
  post?: string | null;
  date?: string | null;
}

export interface MobiliteRequest {
  idDemande: number;
  mobilite: MobiliteItem;
  user: UserResponse;
  status: RequestStatus;
  date: string;
}
