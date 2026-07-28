import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, AuthResponse } from '../models/auth';
import { Register } from '../models/register';
import { Role } from '../models/role';

const TOKEN_KEY = 'atb_token';
const USER_KEY = 'atb_user';
// Legacy: du code ailleurs dans l'app lit/écrit encore directement ces clés
// (userEmail, userId) au lieu de passer par AuthService. Idéalement, il
// faudrait remplacer ces usages par authService.currentUser()/getToken()
// pour n'avoir qu'une seule source de vérité. En attendant, on les nettoie
// nous-mêmes au logout pour éviter les données fantômes d'un ancien compte.
const LEGACY_EMAIL_KEY = 'userEmail';
const LEGACY_USER_ID_KEY = 'userId';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = `${environment.apiUrl}/auth`;

  // signal interne, réhydraté depuis le localStorage au démarrage
  private currentUserSignal = signal<AuthResponse | null>(this.readStoredSession());

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
    localStorage.removeItem(LEGACY_EMAIL_KEY);
    localStorage.removeItem(LEGACY_USER_ID_KEY);
    this.currentUserSignal.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  hasSession(): boolean {
    return this.currentUserSignal() !== null && this.getToken() !== null;
  }

  hasRole(...roles: Role[]): boolean {
    const current = this.role();
    return current !== null && roles.includes(current);
  }

  private setSession(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response));
    // On synchronise aussi les clés legacy pour éviter qu'un vieux composant
    // continue d'afficher l'email/id d'un compte précédent.
    localStorage.setItem(LEGACY_EMAIL_KEY, response.email ?? '');
    localStorage.setItem(LEGACY_USER_ID_KEY, String((response as any).id ?? (response as any).userId ?? ''));
    this.currentUserSignal.set(response);
  }

  private readStoredUser(): AuthResponse | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthResponse) : null;
  }

  private readStoredSession(): AuthResponse | null {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = this.readStoredUser();

    if (!token || !user) {
      return null;
    }

    return user;
  }

  get currentRole(): Role {
    return this.role() ?? Role.SUPERVISEUR;
  }

  get badges(): { notifications?: number; demandes?: number } {
    return {
      notifications: 0,
      demandes: 0,
    };
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/forgot-password`, { email });
  }
}
