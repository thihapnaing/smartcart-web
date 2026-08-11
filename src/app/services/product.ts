import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProductSearchResult } from '../models/product-search-result';
import { ProductDetailResponse } from '../models/product-detail-response';
import { ImageSearchLabel } from '../models/image-search-label'; //Junior

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiBase = `${environment.apiUrl}/products`;

  constructor(private readonly http: HttpClient) {}

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
  searchProducts(keyword: string): Observable<ProductSearchResult[]> {
    return this.http.get<ProductSearchResult[]>(`${this.apiBase}/search`, {
      params: { keyword: keyword }
    });
  }

  getProductById(id: number): Observable<ProductDetailResponse> {
    return this.http.get<ProductDetailResponse>(`${this.apiBase}/${id}`);
  }

  detectImageSearchLabel(file: File): Observable<ImageSearchLabel[]> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post<ImageSearchLabel[]>(
      `${this.apiBase}/search/image`,
      formData
    );
  }
}
