import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestDocumentType, RequestStatus } from '../models/rh-requests';
import { environment } from '../../../environments/environment';

export interface RecognitionRequest { idDemandeReconnaissance: number; user: any; type: RequestDocumentType; motif?: string; status: RequestStatus; date: string; pdfLink?: string; }
@Injectable({ providedIn: 'root' })
export class ReconnaissanceService {
  private http = inject(HttpClient); private baseUrl = `${environment.apiUrl}/demandes-reconnaissance`;
  mine(): Observable<RecognitionRequest[]> { return this.http.get<RecognitionRequest[]>(`${this.baseUrl}/me`); }
  managed(): Observable<RecognitionRequest[]> { return this.http.get<RecognitionRequest[]>(`${this.baseUrl}/managed`); }
  request(type: RequestDocumentType, motif: string): Observable<RecognitionRequest> { return this.http.post<RecognitionRequest>(`${this.baseUrl}/me`, { type, motif }); }
  decide(id: number, decision: RequestStatus | string): Observable<RecognitionRequest> { return this.http.patch<RecognitionRequest>(`${this.baseUrl}/${id}/decision/${decision}`, {}); }
  documentUrl(path: string): string { return `${environment.apiUrl}/documents/${encodeURIComponent(path.split(/[\\/]/).pop() ?? '')}`; }
}
