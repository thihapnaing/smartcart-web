import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecommendationResult } from '../models/recommendation.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RecommendationService {
  private apiUrl = `${environment.apiUrl}/v1/recommendations`;

  constructor(private http: HttpClient) {}

  getRecommendations(userId: number): Observable<RecommendationResult> {
    return this.http.get<RecommendationResult>(`${this.apiUrl}/${userId}`);
  }
}
