import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AddToCartRequest } from '../models/add-to-cart-request';
import { CartItemsResponse } from '../models/cart-items-response';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);

  getCart(): Observable<CartItemsResponse> {
    const url = `${environment.apiUrl}/cart`;
    return this.http.get<CartItemsResponse>(url);
  }

  addToCart(request: AddToCartRequest): Observable<CartItemsResponse> {
    const url = `${environment.apiUrl}/cart/items`;
    return this.http.post<CartItemsResponse>(url, request);
  }
}