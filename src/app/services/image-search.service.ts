import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProductVariantSearchResult {
  id: number;
  size: string;
  stock: number;
}

export interface ProductSearchResult {
  id: number;
  name: string;
  description: string;
  price: number;
  gender: string;
  color: string;
  categoryName: string;
  shopName: string;
  imageUrl: string;
  defaultVariantId: number;
  variants: ProductVariantSearchResult[];
}

@Injectable({
  providedIn: 'root',
})
export class ImageSearchService {
  private apiUrl = `${environment.apiUrl}/products/search/image`;

  constructor(private http: HttpClient) {}

  searchByImage(file: File): Observable<ProductSearchResult[]> {
    const formData = new FormData();

    formData.append('image', file);

    return this.http.post<ProductSearchResult[]>(this.apiUrl, formData);
  }
}
