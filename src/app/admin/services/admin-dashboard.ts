import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminDashboardStats } from '../models/admin-dashboard-stats';

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private readonly apiBase = `${environment.apiUrl}/admin/dashboard`;

  constructor(private readonly http: HttpClient) {}

  getStats(): Observable<AdminDashboardStats> {
    return this.http.get<AdminDashboardStats>(`${this.apiBase}/stats`);
  }
}
