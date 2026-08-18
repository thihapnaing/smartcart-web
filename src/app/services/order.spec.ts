import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { OrderService } from './order';
import { CheckoutRequest } from '../models/checkout-request';
import { CheckoutResponse } from '../models/checkout-response';
import { environment } from '../../environments/environment';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrderService, provideHttpClient(), provideHttpClientTesting()],
    });

    // Creating the service here also confirms it can be built successfully,
    // which is what the original stub test was checking
    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Confirms no requests were made that a test did not expect
    httpMock.verify();
  });

  describe('checkout', () => {
    it('sends a POST request to the checkout endpoint with the given order details', () => {
      const fakeRequest = {} as CheckoutRequest;

      service.checkout(fakeRequest).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/orders/checkout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(fakeRequest);

      req.flush([{} as CheckoutResponse]);
    });

    it('returns the list of created orders from the backend', () => {
      const fakeRequest = {} as CheckoutRequest;
      const fakeResponse = [{} as CheckoutResponse];
      let receivedOrders: CheckoutResponse[] | undefined;

      service.checkout(fakeRequest).subscribe((orders) => {
        receivedOrders = orders;
      });

      const req = httpMock.expectOne(`${apiUrl}/orders/checkout`);
      req.flush(fakeResponse);

      expect(receivedOrders).toEqual(fakeResponse);
    });
  });

  describe('getOrderDetail', () => {
    it('sends a GET request to the order detail endpoint for the given order id', () => {
      const orderId = 42;

      service.getOrderDetail(orderId).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/orders/${orderId}`);
      expect(req.request.method).toBe('GET');

      req.flush({} as CheckoutResponse);
    });

    it('returns the order detail received from the backend', () => {
      const orderId = 42;
      const fakeOrder = {} as CheckoutResponse;
      let receivedOrder: CheckoutResponse | undefined;

      service.getOrderDetail(orderId).subscribe((order) => {
        receivedOrder = order;
      });

      const req = httpMock.expectOne(`${apiUrl}/orders/${orderId}`);
      req.flush(fakeOrder);

      expect(receivedOrder).toEqual(fakeOrder);
    });
  });
});
