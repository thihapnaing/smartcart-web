import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecommendationResult } from '../models/recommendation.model';

@Injectable({
  providedIn: 'root',
})
export class RecommendationService {
  private apiUrl = 'http://localhost:8080/api/v1/recommendations';

  constructor(private http: HttpClient) {}

  getRecommendations(): Observable<RecommendationResult> {
    // Call the base URL; your new auth interceptor will automatically attach the JWT!
    return this.http.get<RecommendationResult>(this.apiUrl);
  }
}
