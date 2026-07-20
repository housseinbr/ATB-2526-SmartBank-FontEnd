import { Role } from './role';

export interface UserResponse {
  id: number;
  cin: string;
  firstName: string;
  lastName: string;
  useName: string;
  email: string;
  numTel: string;
  numFax: string;
  birthday: string;
  sexe: string;
  role: Role;
  solde: number;
  salaire: number;
  idSuperviseur: number | null;
  actif: string;  // "actif" or "inactif"
  superviseur?: UserResponse | null;
}
