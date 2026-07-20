import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserResponse } from '../models/user-response';
import { Role } from '../models/role';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/users`;

  getAllUsersWithSupervisors(): Observable<UserResponse[]> {
    return this.getAllUsers().pipe(
      switchMap(users => {
        const supervisorIds = [
          ...new Set(
            users
              .map(u => u.idSuperviseur)
              .filter((id): id is number => id !== null)
          ),
        ];

        if (supervisorIds.length === 0) {
          return of(users.map(u => ({ ...u, superviseur: null })));
        }

        const supervisorRequests = supervisorIds.map(id => this.getUserById(id));

        return forkJoin(supervisorRequests).pipe(
          map(supervisors => {
            const supervisorMap = new Map(supervisors.map(s => [s.id, s]));
            return users.map(u => ({
              ...u,
              superviseur: u.idSuperviseur
                ? supervisorMap.get(u.idSuperviseur) ?? null
                : null,
            }));
          })
        );
      })
    );
  }

  getAllUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(this.baseUrl);
  }

  getUserById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/${id}`);
  }

  getUsersByRole(role: Role): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.baseUrl}/role/${role}`);
  }

  createUser(user: Partial<UserResponse>): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.baseUrl, user);
  }

  updateUser(id: number, user: Partial<UserResponse>): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.baseUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  toggleActive(id: number, actif: string): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.baseUrl}/${id}`, { actif });
  }

  changePassword(id: number, newPassword: string): Observable<void> {
  return this.http.patch<void>(`${this.baseUrl}/${id}/password`, newPassword);
}
}
