import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DemandeFormation, DemandeFormationStatus } from '../models/demande-formation';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class DemandeFormationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = `${environment.apiUrl}/demandes-formations`;

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  getMine(): Observable<DemandeFormation[]> {
    return this.http.get<DemandeFormation[]>(`${this.baseUrl}/me`, { headers: this.authHeaders() });
  }

  getManaged(): Observable<DemandeFormation[]> {
    return this.http.get<DemandeFormation[]>(`${this.baseUrl}/managed`, { headers: this.authHeaders() });
  }

  getPendingManaged(): Observable<DemandeFormation[]> {
    return this.http.get<DemandeFormation[]>(`${this.baseUrl}/managed/pending`, { headers: this.authHeaders() });
  }

  requestFormation(formationId: number): Observable<DemandeFormation> {
    return this.http.post<DemandeFormation>(`${this.baseUrl}/formation/${formationId}`, {}, { headers: this.authHeaders() });
  }

  decide(id: number, decision: DemandeFormationStatus): Observable<DemandeFormation> {
    return this.http.patch<DemandeFormation>(`${this.baseUrl}/${id}/decision/${decision}`, {}, { headers: this.authHeaders() });
  }
}
