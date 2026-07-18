import { Role } from './role';

export class User {
  id!: number;
  cin!: string;
  firstName!: string;
  lastName!: string;
  useName!: string;
  email!: string;
  numTel!: string;
  numFax!: string;
  birthday!: string; // format ISO "YYYY-MM-DD"
  sexe!: string;
  role!: Role;
  solde!: number;
  salaire!: number;
  superviseur!: User | null;
}