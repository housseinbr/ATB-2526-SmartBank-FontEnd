import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CommentItem } from '../models/comment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/comments`;

  loadMy(): Observable<CommentItem[]> {
    return this.http.get<CommentItem[]>(`${this.baseUrl}/me`, { headers: this.authHeaders() });
  }

  loadAll(): Observable<CommentItem[]> {
    return this.http.get<CommentItem[]>(this.baseUrl, { headers: this.authHeaders() });
  }

  create(text: string): Observable<CommentItem> {
    return this.http.post<CommentItem>(this.baseUrl, { text }, { headers: this.authHeaders() });
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
