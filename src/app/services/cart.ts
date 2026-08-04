import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AddToCartRequest } from '../models/add-to-cart-request';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  addToCart(request: AddToCartRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/cart/items`, request);
  }
}