// Author: Htet Nandar (Grace)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProductSearchResult } from '../models/product-search-result';

/** Talks to Spring Boot's /api/products - backs the home page product grid. */
@Injectable({
  providedIn: 'root'
})
export class Product {
  private readonly apiBase = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  /** All params optional; newestFirst=true sorts by createdAt desc. */
  browse(options?: { keyword?: string; category?: string; gender?: string; newestFirst?: boolean; limit?: number }): Observable<ProductSearchResult[]> {
    const params: Record<string, string | number | boolean> = {};
    if (options?.keyword) params['keyword'] = options.keyword;
    if (options?.category) params['category'] = options.category;
    if (options?.gender) params['gender'] = options.gender;
    if (options?.newestFirst !== undefined) params['newestFirst'] = options.newestFirst;
    if (options?.limit !== undefined) params['limit'] = options.limit;
    return this.http.get<ProductSearchResult[]>(`${this.apiBase}/browse`, { params });
  }
}
