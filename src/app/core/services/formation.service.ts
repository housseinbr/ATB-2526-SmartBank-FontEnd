import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Formation, FormationFormValue } from '../models/formation';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class FormationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = `${environment.apiUrl}/formations`;

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  getAll(): Observable<Formation[]> {
    return this.http.get<Formation[]>(this.baseUrl, { headers: this.authHeaders() });
  }

  getById(id: number): Observable<Formation> {
    return this.http.get<Formation>(`${this.baseUrl}/${id}`, { headers: this.authHeaders() });
  }

  create(payload: FormationFormValue): Observable<Formation> {
    return this.http.post<Formation>(this.baseUrl, payload, { headers: this.authHeaders() });
  }

  update(id: number, payload: FormationFormValue): Observable<Formation> {
    return this.http.put<Formation>(`${this.baseUrl}/${id}`, payload, { headers: this.authHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers: this.authHeaders() });
  }
}
