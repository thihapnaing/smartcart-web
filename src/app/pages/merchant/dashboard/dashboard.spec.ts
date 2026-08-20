import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { MerchantDashboard } from './dashboard';
import { MerchantOrderService } from '../../../services/merchant-order-service';
import { MerchantProductService } from '../../../services/merchant-product-service';
import { MerchantOrderItemResponse } from '../../../models/merchant-order-item-response';
import { ProductSearchResult } from '../../../models/product-search-result';

// Small helpers to build fake API responses without repeating every field each time.
function makeOrder(overrides: Partial<MerchantOrderItemResponse> = {}): MerchantOrderItemResponse {
  return {
    orderId: 1,
    productName: 'T-Shirt',
    size: 'M',
    quantity: 1,
    unitPrice: 20,
    subtotal: 20,
    orderStatus: 'PAID',
    orderDate: '2026-01-01T00:00:00Z',
    deliveredAt: null,
    buyerFirstName: 'Jane',
    buyerLastName: 'Doe',
    ...overrides,
  };
}

function makeProduct(overrides: Partial<ProductSearchResult> = {}): ProductSearchResult {
  return {
    id: 1,
    name: 'T-Shirt',
    description: '',
    price: 20,
    imageUrl: '',
    shopName: 'Shop',
    categoryName: 'Tops',
    gender: 'MEN',
    color: 'Black',
    defaultVariantId: 1,
    status: 'ACTIVE',
    variants: [],
    ...overrides,
  } as ProductSearchResult;
}

describe('MerchantDashboard', () => {
  let component: MerchantDashboard;
  let orderServiceMock: { getMerchantOrders: ReturnType<typeof vi.fn> };
  let productServiceMock: { getMyProducts: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Fresh mocks per test so call history / return values never leak across tests.
    orderServiceMock = { getMerchantOrders: vi.fn() };
    productServiceMock = { getMyProducts: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        MerchantDashboard,
        { provide: MerchantOrderService, useValue: orderServiceMock },
        { provide: MerchantProductService, useValue: productServiceMock },
      ],
    });
  });

  // --- ngOnInit ---

  describe('ngOnInit', () => {
    it('loads orders and products and turns off loading on success', () => {
      const orders = [makeOrder({ orderId: 1 })];
      const products = [makeProduct({ id: 1 })];
      orderServiceMock.getMerchantOrders.mockReturnValue(of(orders));
      productServiceMock.getMyProducts.mockReturnValue(of(products));

      component = TestBed.inject(MerchantDashboard);
      component.ngOnInit();

      expect(orderServiceMock.getMerchantOrders).toHaveBeenCalledTimes(1);
      expect(productServiceMock.getMyProducts).toHaveBeenCalledTimes(1);
      expect(component.orders()).toEqual(orders);
      expect(component.products()).toEqual(products);
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
    });

    it('sets errorMessage and turns off loading when the request fails', () => {
      orderServiceMock.getMerchantOrders.mockReturnValue(of([]));
      productServiceMock.getMyProducts.mockReturnValue(throwError(() => new Error('boom')));

      component = TestBed.inject(MerchantDashboard);
      component.ngOnInit();

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Could not load dashboard data. Please try again.');
    });

    it('sets isLoading to true while the request is in flight', () => {
      orderServiceMock.getMerchantOrders.mockReturnValue(of([]));
      productServiceMock.getMyProducts.mockReturnValue(of([]));

      component = TestBed.inject(MerchantDashboard);
      expect(component.isLoading()).toBe(true);
    });
  });

  // --- computed signals ---

  describe('computed signals', () => {
    beforeEach(() => {
      const orders = [
        makeOrder({ orderId: 1, orderStatus: 'PAID', subtotal: 20, orderDate: '2026-01-01T00:00:00Z' }),
        makeOrder({ orderId: 1, orderStatus: 'PAID', subtotal: 5, orderDate: '2026-01-01T00:00:00Z' }), // second item, same order
        makeOrder({ orderId: 2, orderStatus: 'DELIVERED', subtotal: 30, orderDate: '2026-01-03T00:00:00Z' }),
        makeOrder({ orderId: 3, orderStatus: 'CANCELLED', subtotal: 999, orderDate: '2026-01-02T00:00:00Z' }),
      ];
      const products = [
        makeProduct({ id: 1, status: 'ACTIVE' }),
        makeProduct({ id: 2, status: 'ACTIVE' }),
        makeProduct({ id: 3, status: 'INACTIVE' }),
      ];
      orderServiceMock.getMerchantOrders.mockReturnValue(of(orders));
      productServiceMock.getMyProducts.mockReturnValue(of(products));

      component = TestBed.inject(MerchantDashboard);
      component.ngOnInit();
    });

    it('totalRevenue sums subtotal across all non-cancelled order items', () => {
      expect(component.totalRevenue()).toBe(55); // 20 + 5 + 30, the 999 cancelled item excluded
    });

    it('totalOrders counts distinct order ids, including cancelled ones', () => {
      expect(component.totalOrders()).toBe(3); // orderId 1, 2, 3
    });

    it('pendingOrders counts distinct order ids that are still PAID', () => {
      expect(component.pendingOrders()).toBe(1); // only orderId 1
    });

    it('activeProducts counts only ACTIVE products', () => {
      expect(component.activeProducts()).toBe(2);
    });

    it('recentOrders sorts by orderDate, most recent first', () => {
      const dates = component.recentOrders().map((o) => o.orderDate);
      expect(dates).toEqual(['2026-01-03T00:00:00Z', '2026-01-02T00:00:00Z', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z']);
    });

    it('recentOrders caps the list at 5 items', () => {
      const many = Array.from({ length: 8 }, (_, i) =>
        makeOrder({ orderId: i, orderDate: `2026-01-0${(i % 9) + 1}T00:00:00Z` }),
      );
      orderServiceMock.getMerchantOrders.mockReturnValue(of(many));
      productServiceMock.getMyProducts.mockReturnValue(of([]));

      const fresh = TestBed.inject(MerchantDashboard);
      fresh.ngOnInit();

      expect(fresh.recentOrders().length).toBe(5);
    });
  });

  // --- rendering (actually draws the template, unlike the tests above) ---

  describe('rendering', () => {
    let fixture: ComponentFixture<MerchantDashboard>;

    it('shows the KPI values once data has loaded', () => {
      orderServiceMock.getMerchantOrders.mockReturnValue(
        of([makeOrder({ orderId: 1, orderStatus: 'PAID', subtotal: 20 })]),
      );
      productServiceMock.getMyProducts.mockReturnValue(of([makeProduct({ status: 'ACTIVE' })]));

      fixture = TestBed.createComponent(MerchantDashboard);
      fixture.detectChanges();

      const values = Array.from(fixture.nativeElement.querySelectorAll('.kpi-value')).map(
        (el: any) => el.textContent.trim(),
      );
      expect(values).toEqual(['$20.00', '1', '1', '1']);
    });

    it('shows "No orders yet." when there are no orders', () => {
      orderServiceMock.getMerchantOrders.mockReturnValue(of([]));
      productServiceMock.getMyProducts.mockReturnValue(of([]));

      fixture = TestBed.createComponent(MerchantDashboard);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('No orders yet.');
    });

    it('shows the error message when loading fails', () => {
      orderServiceMock.getMerchantOrders.mockReturnValue(throwError(() => new Error('boom')));
      productServiceMock.getMyProducts.mockReturnValue(of([]));

      fixture = TestBed.createComponent(MerchantDashboard);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Could not load dashboard data. Please try again.');
    });
  });
});
