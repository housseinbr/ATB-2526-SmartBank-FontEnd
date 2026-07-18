import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user';
import { Role } from '../models/role';

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl);
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  getByRole(role: Role): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/role/${role}`);
  }

  getSubordonnes(idSuperviseur: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/${idSuperviseur}/subordonnes`);
  }

  create(user: Partial<User>): Observable<User> {
    return this.http.post<User>(this.baseUrl, user);
  }

  update(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, user);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  assignSuperviseur(idUser: number, idSuperviseur: number): Observable<User> {
    return this.http.patch<User>(
      `${this.baseUrl}/${idUser}/superviseur/${idSuperviseur}`,
      {}
    );
  }

  changePassword(id: number, newPassword: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/password`, newPassword);
  }
}