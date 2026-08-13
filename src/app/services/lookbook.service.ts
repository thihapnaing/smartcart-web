import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LookbookResponse } from '../models/lookbook.model';

@Injectable({
  providedIn: 'root',
})
export class LookbookService {
  private apiUrl = 'http://localhost:8080/api/home/trends/lookbook';

  constructor(private http: HttpClient) {} //[cite: 11]

  getLookbookTrends(): Observable<LookbookResponse> {
    return this.http.get<LookbookResponse>(this.apiUrl);
  }
}