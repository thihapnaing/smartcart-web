import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MerchantOrderService } from './merchant-order-service';
import { MerchantOrderItemResponse } from '../models/merchant-order-item-response';
import { environment } from '../../environments/environment';

describe('MerchantOrderService', () => {
  let service: MerchantOrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MerchantOrderService]
    });
    service = TestBed.inject(MerchantOrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Confirms no unexpected or unanswered requests were made during the test.
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getMerchantOrders should call the correct URL and return the response data', () => {
    const mockOrders: MerchantOrderItemResponse[] = [
      {
        orderId: 1,
        productName: 'Classic Oxford Shirt',
        size: 'L',
        quantity: 1,
        unitPrice: 89.99,
        subtotal: 89.99,
        orderStatus: 'DELIVERED',
        orderDate: '2026-08-07',
        deliveredAt: '2026-08-10T14:30:00',
        buyerFirstName: 'Marcus',
        buyerLastName: 'Reid'
      }
    ];

    service.getMerchantOrders().subscribe(orders => {
      expect(orders).toEqual(mockOrders);
    });

    // Intercepts the outgoing request instead of letting it hit a real server.
    const req = httpMock.expectOne(`${environment.apiUrl}/orders/merchant`);
    expect(req.request.method).toBe('GET');
    req.flush(mockOrders); // Supplies the fake response data.
  });
});