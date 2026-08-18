import { TestBed, ComponentFixture } from '@angular/core/testing';
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
    deliveredAt: null,
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

  // --- selectStatus / filteredOrders / showActionColumn / showDateColumn ---

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

    it('hides the date column only on the PACKED and PICKED_UP tabs', () => {
      component.selectStatus('ALL');
      expect(component.showDateColumn()).toBe(true);

      component.selectStatus('PAID');
      expect(component.showDateColumn()).toBe(true);

      component.selectStatus('PACKED');
      expect(component.showDateColumn()).toBe(false);

      component.selectStatus('PICKED_UP');
      expect(component.showDateColumn()).toBe(false);

      component.selectStatus('DELIVERED');
      expect(component.showDateColumn()).toBe(true);
    });
  });

  // --- getDisplayDate ---

  describe('getDisplayDate', () => {
    beforeEach(() => {
      // No orders need to be loaded here — the method only reads the
      // single order object passed directly into it.
      component = TestBed.inject(OrdersList);
    });

    it('returns orderDate for a PAID order', () => {
      const order = makeOrder({ orderStatus: 'PAID', orderDate: new Date('2026-01-05') as any });
      expect(component.getDisplayDate(order)).toEqual(order.orderDate);
    });

    it('returns deliveredAt for a DELIVERED order', () => {
      const deliveredAt = new Date('2026-01-10') as any;
      const order = makeOrder({ orderStatus: 'DELIVERED', deliveredAt });
      expect(component.getDisplayDate(order)).toEqual(deliveredAt);
    });

    it('falls back to orderDate when a DELIVERED order has no deliveredAt yet', () => {
      const order = makeOrder({ orderStatus: 'DELIVERED', orderDate: new Date('2026-01-05') as any, deliveredAt: null });
      expect(component.getDisplayDate(order)).toEqual(order.orderDate);
    });

    it('returns orderDate for statuses other than PAID and DELIVERED', () => {
      const order = makeOrder({ orderStatus: 'PENDING', orderDate: new Date('2026-01-05') as any });
      expect(component.getDisplayDate(order)).toEqual(order.orderDate);
    });
  });

  // --- rendering (actually draws the template, unlike the tests above) ---

  describe('rendering', () => {
    let fixture: ComponentFixture<OrdersList>;

    beforeEach(() => {
      const orders = [
        makeOrder({ orderId: 1, orderStatus: 'PAID' }),
        makeOrder({ orderId: 2, orderStatus: 'DELIVERED', deliveredAt: new Date('2026-02-01') as any })
      ];
      serviceMock.getMerchantOrders.mockReturnValue(of(orders));

      // createComponent (instead of inject) builds a real, drawable copy of
      // the component. detectChanges() then runs ngOnInit and paints the
      // template, the same way a real browser tab would on page load.
      fixture = TestBed.createComponent(OrdersList);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

it('renders one table row per loaded order', () => {
  const rows = fixture.nativeElement.querySelectorAll('tbody tr');
  expect(rows).toHaveLength(2);
});

it('renders a tab button for every entry in statusTabs', () => {
  const buttons = fixture.nativeElement.querySelectorAll('.tab-button');
  expect(buttons).toHaveLength(component.statusTabs.length);
});

    it('shows the Date column header on the Paid tab', () => {
      component.selectStatus('PAID');
      fixture.detectChanges(); // re-paint the template after the state change

      const headers = Array.from(fixture.nativeElement.querySelectorAll('thead th'))
        .map((th: any) => th.textContent.trim());
      expect(headers).toContain('Date');
    });

    it('hides the Date column header on the Packed tab', () => {
      component.selectStatus('PACKED');
      fixture.detectChanges();

      const headers = Array.from(fixture.nativeElement.querySelectorAll('thead th'))
        .map((th: any) => th.textContent.trim());
      expect(headers).not.toContain('Date');
    });

    it('shows a "No orders match this filter" message when a tab has no matches', () => {
      component.selectStatus('CANCELLED');
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('No orders match this filter.');
    });
  });
});