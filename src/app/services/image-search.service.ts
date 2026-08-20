import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ImageSearchResponse } from '../models/image-search-response';

@Injectable({
  providedIn: 'root',
})
export class ImageSearchService {
  private readonly apiUrl = `${environment.apiUrl}/products/search/image`;

  constructor(private readonly http: HttpClient) {}

  searchByImage(file: File): Observable<ImageSearchResponse> {
    const formData = new FormData();

    formData.append('image', file);

    return this.http.post<ImageSearchResponse>(this.apiUrl, formData);
  }
}
