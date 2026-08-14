import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PublicStats } from '../models/public-stats';

// Author: Htet Nandar (Grace)
// Unauthenticated counterpart to AdminDashboardService - used by the /admin/login screen, which
// renders before there's a JWT, so it can't call the ADMIN-gated /api/admin/dashboard/stats.
@Injectable({
  providedIn: 'root',
})
export class PublicStatsService {
  private readonly apiBase = `${environment.apiUrl}/public`;

  constructor(private readonly http: HttpClient) {}

  getStats(): Observable<PublicStats> {
    return this.http.get<PublicStats>(`${this.apiBase}/stats`);
  }
}
