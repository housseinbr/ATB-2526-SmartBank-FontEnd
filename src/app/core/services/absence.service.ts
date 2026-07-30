import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Absence, HistorySold, StatusAbsence } from '../models/absence';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AbsenceApiService {
  private readonly baseUrl = `${environment.apiUrl}/abcences`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  getAll(): Observable<Absence[]> {
    return this.http.get<Absence[]>(this.baseUrl, { headers: this.authHeaders() });
  }

  getMine(): Observable<Absence[]> {
    return this.http.get<Absence[]>(`${this.baseUrl}/me`, { headers: this.authHeaders() });
  }

  getTeamAbsences(): Observable<Absence[]> {
    return this.http.get<Absence[]>(`${this.baseUrl}/team`, { headers: this.authHeaders() });
  }

  getTeamPendingAbsences(): Observable<Absence[]> {
    return this.http.get<Absence[]>(`${this.baseUrl}/team/pending`, { headers: this.authHeaders() });
  }

  getMineHistory(): Observable<HistorySold[]> {
    return this.http.get<HistorySold[]>(`${this.baseUrl}/history/me`, { headers: this.authHeaders() });
  }

  getHistoryForUser(userId: number): Observable<HistorySold[]> {
    return this.http.get<HistorySold[]>(`${this.baseUrl}/history/user/${userId}`, { headers: this.authHeaders() });
  }

  getById(id: number): Observable<Absence> {
    return this.http.get<Absence>(`${this.baseUrl}/${id}`, { headers: this.authHeaders() });
  }

  create(absence: Absence): Observable<Absence> {
    return this.http.post<Absence>(this.baseUrl, absence, { headers: this.authHeaders() });
  }

  update(id: number, absence: Absence): Observable<Absence> {
    return this.http.put<Absence>(`${this.baseUrl}/${id}`, absence, { headers: this.authHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers: this.authHeaders() });
  }

  decide(id: number, decision: StatusAbsence): Observable<Absence> {
    return this.http.patch<Absence>(`${this.baseUrl}/${id}/decision/${decision}`, {}, { headers: this.authHeaders() });
  }
}
