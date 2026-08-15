import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminMerchantDetail, AdminMerchantSummary, MerchantStatus } from '../models/admin-merchant-summary';

// AUTHOR: Htet Nandar(Grace)
@Injectable({
  providedIn: 'root'
})
export class AdminMerchantService {
  private readonly apiBase = `${environment.apiUrl}/admin/merchants`;

  constructor(private readonly http: HttpClient) {}

  getAllMerchants(): Observable<AdminMerchantSummary[]> {
    return this.http.get<AdminMerchantSummary[]>(this.apiBase);
  }

  getMerchantDetail(merchantId: number): Observable<AdminMerchantDetail> {
    return this.http.get<AdminMerchantDetail>(`${this.apiBase}/${merchantId}`);
  }

  updateStatus(merchantId: number, status: MerchantStatus): Observable<AdminMerchantSummary> {
    return this.http.patch<AdminMerchantSummary>(`${this.apiBase}/${merchantId}/status`, { status });
  }
}
