import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, AuthResponse } from '../models/auth';
import { Register } from '../models/register';
import { Role } from '../models/role';

const TOKEN_KEY = 'atb_token';
const USER_KEY = 'atb_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = `${environment.apiUrl}/auth`;

  // signal interne, réhydraté depuis le localStorage au démarrage
  private currentUserSignal = signal<AuthResponse | null>(this.readStoredUser());

  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = computed(() => this.currentUserSignal() !== null);
  role = computed(() => this.currentUserSignal()?.role ?? null);

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, request)
      .pipe(tap((response) => this.setSession(response)));
  }

  // Réservé au bootstrap du tout premier compte admin.
  // Pour créer des employés/superviseurs au quotidien, utiliser UserService.create()
  // (route /api/users, protégée ADMIN) plutôt que cette route publique.
  register(request: Register): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, request)
      .pipe(tap((response) => this.setSession(response)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSignal.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  hasRole(...roles: Role[]): boolean {
    const current = this.role();
    return current !== null && roles.includes(current);
  }

  private setSession(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response));
    this.currentUserSignal.set(response);
  }

  private readStoredUser(): AuthResponse | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthResponse) : null;
  }
}