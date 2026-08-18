import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RequestStatus } from '../models/rh-requests';

export interface EvaluationItem { idEvaluation: number; user: any; superviseur: any; title: string; desc: string; date: string; lieu: string; status: RequestStatus; }
export interface EvaluationPayload { title: string; desc: string; date?: string; lieu?: string; }

@Injectable({ providedIn: 'root' })
export class EvaluationService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/evaluations`;
  mine(): Observable<EvaluationItem[]> { return this.http.get<EvaluationItem[]>(`${this.baseUrl}/me`); }
  managed(): Observable<EvaluationItem[]> { return this.http.get<EvaluationItem[]>(`${this.baseUrl}/managed`); }
  create(userId: number, payload: EvaluationPayload): Observable<EvaluationItem> { return this.http.post<EvaluationItem>(`${this.baseUrl}/user/${userId}`, payload); }
  decide(id: number, decision: RequestStatus | string): Observable<EvaluationItem> { return this.http.patch<EvaluationItem>(`${this.baseUrl}/${id}/decision/${decision}`, {}); }
}
