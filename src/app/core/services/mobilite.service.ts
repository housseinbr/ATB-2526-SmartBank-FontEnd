import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { MobiliteItem, MobiliteRequest, RequestStatus } from '../models/rh-requests';

@Injectable({ providedIn: 'root' })
export class MobiliteService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = environment.apiUrl;

  getMobilites(): Observable<MobiliteItem[]> {
    return this.http.get<MobiliteItem[]>(`${this.baseUrl}/mobilites`, { headers: this.authHeaders() });
  }

  getMine(): Observable<MobiliteRequest[]> {
    return this.http.get<MobiliteRequest[]>(`${this.baseUrl}/demandes-mobilites/me`, { headers: this.authHeaders() });
  }

  getManaged(): Observable<MobiliteRequest[]> {
    return this.http.get<MobiliteRequest[]>(`${this.baseUrl}/demandes-mobilites/managed`, { headers: this.authHeaders() });
  }

  getPendingManaged(): Observable<MobiliteRequest[]> {
    return this.http.get<MobiliteRequest[]>(`${this.baseUrl}/demandes-mobilites/managed/pending`, { headers: this.authHeaders() });
  }

  request(mobiliteId: number): Observable<MobiliteRequest> {
    return this.http.post<MobiliteRequest>(`${this.baseUrl}/demandes-mobilites/mobilite/${mobiliteId}`, {}, { headers: this.authHeaders() });
  }

  decide(id: number, decision: RequestStatus): Observable<MobiliteRequest> {
    return this.http.patch<MobiliteRequest>(`${this.baseUrl}/demandes-mobilites/${id}/decision/${decision}`, {}, { headers: this.authHeaders() });
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
