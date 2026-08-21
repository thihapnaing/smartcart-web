import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { CartService } from './cart';
import { CartItemDetail } from '../models/cart-item-detail';
import { CartItemsResponse } from '../models/cart-items-response';
import { environment } from '../../environments/environment';

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;
  const apiBase = `${environment.apiUrl}/cart`;

  // A blank cart response used to answer the automatic request the
  // constructor sends the moment the service is created
  const emptyCart = {
    cartItemDetails: [],
    cartTotal: 0,
  } as CartItemsResponse;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CartService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);

    // The constructor calls refresh(), which fires a GET request right away.
    // Answering it here first keeps each individual test's own requests
    // from being mixed up with this startup request.
    const initialReq = httpMock.expectOne(apiBase);
    initialReq.flush(emptyCart);
  });

  afterEach(() => {
    // Confirms no requests were made that a test did not expect
    httpMock.verify();
  });

  describe('getCart', () => {
    it('sends a GET request and updates the cart signals from the response', () => {
      const fakeItem = { cartItemId: 1, productVariantId: 100, quantity: 3 } as CartItemDetail;
      const fakeResponse = {
        cartItemDetails: [fakeItem],
        cartTotal: 59.99,
      } as CartItemsResponse;

      service.getCart().subscribe();

      const req = httpMock.expectOne(apiBase);
      expect(req.request.method).toBe('GET');
      req.flush(fakeResponse);

      expect(service.items()).toEqual([fakeItem]);
      expect(service.itemCount()).toBe(3);
      expect(service.cartTotal()).toBe(59.99);
    });
  });

  describe('refresh', () => {
    it('leaves the existing cart signals unchanged if the request fails', () => {
      // First load some real data in, so a change (or lack of one) is noticeable
      const fakeItem = { cartItemId: 1, productVariantId: 100, quantity: 2 } as CartItemDetail;
      service.getCart().subscribe();
      httpMock.expectOne(apiBase).flush({
        cartItemDetails: [fakeItem],
        cartTotal: 20,
      } as CartItemsResponse);

      service.refresh();

      const req = httpMock.expectOne(apiBase);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      // The cart signals should be exactly what they were before the failed refresh
      expect(service.items()).toEqual([fakeItem]);
      expect(service.itemCount()).toBe(2);
      expect(service.cartTotal()).toBe(20);
    });
  });

  describe('quantityFor', () => {
    it('returns the quantity of a product variant that is in the cart', () => {
      const fakeItem = { cartItemId: 1, productVariantId: 100, quantity: 4 } as CartItemDetail;
      service.getCart().subscribe();
      httpMock.expectOne(apiBase).flush({
        cartItemDetails: [fakeItem],
        cartTotal: 40,
      } as CartItemsResponse);

      expect(service.quantityFor(100)).toBe(4);
    });

    it('returns 0 when the product variant is not in the cart', () => {
      expect(service.quantityFor(999)).toBe(0);
    });
  });

  describe('cartItemIdFor', () => {
    it('returns the cart item id of a product variant that is in the cart', () => {
      const fakeItem = { cartItemId: 7, productVariantId: 100, quantity: 1 } as CartItemDetail;
      service.getCart().subscribe();
      httpMock.expectOne(apiBase).flush({
        cartItemDetails: [fakeItem],
        cartTotal: 10,
      } as CartItemsResponse);

      expect(service.cartItemIdFor(100)).toBe(7);
    });

    it('returns null when the product variant is not in the cart', () => {
      expect(service.cartItemIdFor(999)).toBeNull();
    });
  });

  describe('addToCart', () => {
    it('defaults the quantity to 1 when none is given', () => {
      service.addToCart(100).subscribe();

      const req = httpMock.expectOne(`${apiBase}/items`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ productVariantId: 100, quantity: 1 });

      req.flush(emptyCart);
    });

    it('sends the given quantity when one is provided', () => {
      service.addToCart(100, 5).subscribe();

      const req = httpMock.expectOne(`${apiBase}/items`);
      expect(req.request.body).toEqual({ productVariantId: 100, quantity: 5 });

      req.flush(emptyCart);
    });

    it('updates the cart signals from the response', () => {
      const fakeItem = { cartItemId: 2, productVariantId: 100, quantity: 5 } as CartItemDetail;
      const fakeResponse = {
        cartItemDetails: [fakeItem],
        cartTotal: 50,
      } as CartItemsResponse;

      service.addToCart(100, 5).subscribe();
      httpMock.expectOne(`${apiBase}/items`).flush(fakeResponse);

      expect(service.items()).toEqual([fakeItem]);
      expect(service.itemCount()).toBe(5);
      expect(service.cartTotal()).toBe(50);
    });
  });

  describe('updateQuantity', () => {
    it('sends a PATCH request with the new quantity to the correct cart item', () => {
      service.updateQuantity(2, 3).subscribe();

      const req = httpMock.expectOne(`${apiBase}/items/2`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ quantity: 3 });

      req.flush(emptyCart);
    });

    it('updates the cart signals from the response', () => {
      const fakeItem = { cartItemId: 2, productVariantId: 100, quantity: 3 } as CartItemDetail;
      const fakeResponse = {
        cartItemDetails: [fakeItem],
        cartTotal: 30,
      } as CartItemsResponse;

      service.updateQuantity(2, 3).subscribe();
      httpMock.expectOne(`${apiBase}/items/2`).flush(fakeResponse);

      expect(service.items()).toEqual([fakeItem]);
      expect(service.itemCount()).toBe(3);
      expect(service.cartTotal()).toBe(30);
    });
  });
});