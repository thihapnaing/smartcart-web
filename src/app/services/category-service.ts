import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CategoryResponse } from '../models/category-response';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly apiBase = `${environment.apiUrl}/categories`;
  private readonly http = inject(HttpClient);

  getCategories(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(this.apiBase);
  }
}