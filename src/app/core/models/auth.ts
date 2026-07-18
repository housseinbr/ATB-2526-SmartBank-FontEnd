import { Role } from './role';

export class LoginRequest {
  email!: string;
  password!: string;
}

export class AuthResponse {
  token!: string;
  id!: number;
  email!: string;
  firstName!: string;
  lastName!: string;
  role!: Role;
}