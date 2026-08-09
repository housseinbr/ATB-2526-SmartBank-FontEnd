import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Competance } from '../models/competance';

@Injectable({
  providedIn: 'root',
})
export class CompetanceService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/competances`;

  getMine(): Observable<Competance[]> {
    return this.http.get<Competance[]>(`${this.baseUrl}/me`);
  }

  getForUser(userId: number): Observable<Competance[]> {
    return this.http.get<Competance[]>(`${this.baseUrl}/user/${userId}`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
