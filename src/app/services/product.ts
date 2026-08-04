import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProductSearchResult } from '../models/product-search-result';
import { ProductDetailResponse } from '../models/product-detail-response';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  searchProducts(keyword: string): Observable<ProductSearchResult[]> {
    return this.http.get<ProductSearchResult[]>(`${this.apiUrl}/products/search`, {
      params: { keyword: keyword }
    });
  }

  getProductById(id: number): Observable<ProductDetailResponse> {
    return this.http.get<ProductDetailResponse>(`${this.apiUrl}/products/${id}`);
  }
}