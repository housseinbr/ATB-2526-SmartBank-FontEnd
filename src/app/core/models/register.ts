import { Role } from './role';

export class Register {
  cin!: string;
  firstName!: string;
  lastName!: string;
  useName?: string;
  email!: string;
  numTel?: string;
  numFax?: string;
  password!: string;
  birthday?: string; // format ISO "YYYY-MM-DD"
  sexe?: string;
  role!: Role;
  salaire?: number;
}
