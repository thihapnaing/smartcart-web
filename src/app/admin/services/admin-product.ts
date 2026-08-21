import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminProductSummary } from '../models/admin-product-summary';

@Injectable({
  providedIn: 'root'
})
export class AdminProductService {
  private readonly apiBase = `${environment.apiUrl}/admin/products`;

  constructor(private readonly http: HttpClient) {}

  getAllProducts(): Observable<AdminProductSummary[]> {
    return this.http.get<AdminProductSummary[]>(this.apiBase);
  }

  updateStatus(productId: number, status: 'ACTIVE' | 'INACTIVE'): Observable<AdminProductSummary> {
    return this.http.patch<AdminProductSummary>(`${this.apiBase}/${productId}/status`, { status });
  }
}
