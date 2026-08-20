import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface AiLeaveRecommendation {
  recommendation: 'APPROVE' | 'REJECT' | 'REVIEW';
  confidence: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  risks: string[];
  evidence: string[];
  ai_explanation: string;
}

export interface AiAction { intent?: string; leave_type?: string; start_date?: string; end_date?: string; requested_days?: number; }
export interface AiChatResponse { model: string; response: string; state?: string; intent?: string; action?: AiAction; }
export interface AiConversation { id: number; title: string; updatedAt: string; }
export interface AiStoredMessage { role: 'user' | 'assistant'; content: string; createdAt: string; }

@Injectable({ providedIn: 'root' })
export class AiService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  leaveRecommendation(absenceId: number): Observable<AiLeaveRecommendation> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
    return this.http.post<AiLeaveRecommendation>(`${environment.apiUrl}/ai/leaves/${absenceId}/recommendation`, {}, { headers });
  }

  chat(message: string): Observable<AiChatResponse> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
    return this.http.post<AiChatResponse>(`${environment.apiUrl}/ai/chat`, { message }, { headers });
  }
  conversations(): Observable<AiConversation[]> { return this.http.get<AiConversation[]>(`${environment.apiUrl}/ai/conversations`, { headers: this.headers() }); }
  adminConversations(userId: number): Observable<AiConversation[]> { return this.http.get<AiConversation[]>(`${environment.apiUrl}/ai/admin/users/${userId}/conversations`, { headers: this.headers() }); }
  conversationMessages(id: number): Observable<AiStoredMessage[]> { return this.http.get<AiStoredMessage[]>(`${environment.apiUrl}/ai/conversations/${id}/messages`, { headers: this.headers() }); }
  deleteConversation(id: number): Observable<void> { return this.http.delete<void>(`${environment.apiUrl}/ai/conversations/${id}`, { headers: this.headers() }); }
  conversationChat(message: string, conversationId: number | null): Observable<{conversationId:number;response:string;state?:string;intent?:string;action?:AiAction}> { return this.http.post<{conversationId:number;response:string;state?:string;intent?:string;action?:AiAction}>(`${environment.apiUrl}/ai/conversations/chat`, { message, conversationId }, { headers: this.headers() }); }
  confirmAction(sessionId: string, confirmation: string): Observable<AiChatResponse> { return this.http.post<AiChatResponse>(`${environment.apiUrl}/ai/action/confirm`, { sessionId, confirmation }, { headers: this.headers() }); }
  private headers(): HttpHeaders { const token=this.auth.getToken(); return token ? new HttpHeaders({Authorization:`Bearer ${token}`}) : new HttpHeaders(); }
}
