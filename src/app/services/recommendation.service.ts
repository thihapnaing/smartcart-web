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

  getRecommendations(): Observable<RecommendationResult> {
    // Call the base URL; your new auth interceptor will automatically attach the JWT!
    return this.http.get<RecommendationResult>(this.apiUrl);
  }
}
