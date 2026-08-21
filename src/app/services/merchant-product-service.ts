import {Injectable, inject} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProductRequest } from '../models/product-request';
import { ProductDetailResponse } from '../models/product-detail-response';
import { ProductSearchResult } from '../models/product-search-result';
import { ImageUploadResponse } from '../models/image-upload-response';

@Injectable({
  providedIn: 'root'
})
export class MerchantProductService {

    private readonly apiBase = `${environment.apiUrl}/products`;
    private readonly http = inject(HttpClient);

    getMyProducts(): Observable<ProductSearchResult[]> {
        return this.http.get<ProductSearchResult[]>(`${this.apiBase}/own`);
    }

    getProductDetail(id: number): Observable<ProductDetailResponse> {
        return this.http.get<ProductDetailResponse>(`${this.apiBase}/${id}`);
    }

    createProduct(request: ProductRequest): Observable<ProductDetailResponse> {
        return this.http.post<ProductDetailResponse>(this.apiBase, request);
    }

    updateProduct(id: number, request: ProductRequest): Observable<ProductDetailResponse> {
        return this.http.put<ProductDetailResponse>(`${this.apiBase}/${id}`, request);
    }

    activateProduct(id: number): Observable<ProductDetailResponse> {
        return this.http.patch<ProductDetailResponse>(`${this.apiBase}/${id}/activate`, {});
    }

    deactivateProduct(id: number): Observable<ProductDetailResponse> {
        return this.http.delete<ProductDetailResponse>(`${this.apiBase}/${id}`);
    }

    uploadImage(file: File): Observable<ImageUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<ImageUploadResponse>(`${this.apiBase}/image-upload`, formData);
    }
}
