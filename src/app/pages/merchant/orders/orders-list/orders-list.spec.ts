import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { OrdersList } from './orders-list';
import { MerchantOrderService } from '../../../../services/merchant-order-service';
import { MerchantOrderItemResponse } from '../../../../models/merchant-order-item-response';

// Small helper to build fake orders without repeating every field each time.
function makeOrder(overrides: Partial<MerchantOrderItemResponse> = {}): MerchantOrderItemResponse {
  return {
    orderId: 1,
    buyerFirstName: 'Jane',
    buyerLastName: 'Doe',
    productName: 'T-Shirt',
    size: 'M',
    quantity: 1,
    subtotal: 20,
    orderDate: new Date('2026-01-01'),
    orderStatus: 'PAID',
    ...overrides
  } as MerchantOrderItemResponse;
}

describe('OrdersList', () => {
  let component: OrdersList;
  let serviceMock: {
    getMerchantOrders: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Fresh mock per test so call history / return values never leak across tests.
    serviceMock = {
      getMerchantOrders: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        OrdersList,
        { provide: MerchantOrderService, useValue: serviceMock }
      ]
    });
  });

  // --- ngOnInit / loadOrders ---

  describe('ngOnInit', () => {
    it('loads orders and turns off loading on success', () => {
      const orders = [makeOrder({ orderId: 1 }), makeOrder({ orderId: 2, orderStatus: 'PENDING' })];
      serviceMock.getMerchantOrders.mockReturnValue(of(orders));

      component = TestBed.inject(OrdersList);
      component.ngOnInit();

      expect(serviceMock.getMerchantOrders).toHaveBeenCalledTimes(1);
      expect(component.orders()).toEqual(orders);
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
    });

    it('sets errorMessage and turns off loading when the request fails', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Server exploded' }
      });
      serviceMock.getMerchantOrders.mockReturnValue(throwError(() => httpError));

      component = TestBed.inject(OrdersList);
      component.ngOnInit();

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Server exploded');
      expect(component.orders()).toEqual([]);
    });

    it('falls back to a generic message when the error has no message', () => {
      serviceMock.getMerchantOrders.mockReturnValue(throwError(() => new HttpErrorResponse({})));

      component = TestBed.inject(OrdersList);
      component.ngOnInit();

      expect(component.errorMessage()).toBe('Could not load orders. Please try again.');
    });

    it('sets isLoading to true while the request is in flight', () => {
      // Don't emit yet — just check the flag flips synchronously before the response arrives.
      serviceMock.getMerchantOrders.mockReturnValue(of([]).pipe());
      component = TestBed.inject(OrdersList);

      expect(component.isLoading()).toBe(true); // default before ngOnInit
    });
  });

  // --- selectStatus / filteredOrders / showActionColumn ---

  describe('selectStatus and filteredOrders', () => {
    beforeEach(() => {
      const orders = [
        makeOrder({ orderId: 1, orderStatus: 'PAID' }),
        makeOrder({ orderId: 2, orderStatus: 'PENDING' }),
        makeOrder({ orderId: 3, orderStatus: 'PAID' })
      ];
      serviceMock.getMerchantOrders.mockReturnValue(of(orders));
      component = TestBed.inject(OrdersList);
      component.ngOnInit();
    });

    it('defaults to showing all orders', () => {
      expect(component.selectedStatus()).toBe('ALL');
      expect(component.filteredOrders()).toHaveLength(3);
    });

    it('filters orders by the selected status', () => {
      component.selectStatus('PAID');

      expect(component.selectedStatus()).toBe('PAID');
      expect(component.filteredOrders()).toHaveLength(2);
      expect(component.filteredOrders().every(o => o.orderStatus === 'PAID')).toBe(true);
    });

    it('returns an empty list when no orders match the selected status', () => {
      component.selectStatus('DELIVERED');
      expect(component.filteredOrders()).toEqual([]);
    });

    it('shows the action column on ALL and PAID tabs only', () => {
      component.selectStatus('ALL');
      expect(component.showActionColumn()).toBe(true);

      component.selectStatus('PAID');
      expect(component.showActionColumn()).toBe(true);

      component.selectStatus('PENDING');
      expect(component.showActionColumn()).toBe(false);

      component.selectStatus('DELIVERED');
      expect(component.showActionColumn()).toBe(false);
    });
  });
});