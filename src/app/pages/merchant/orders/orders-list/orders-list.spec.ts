import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { OrdersList } from './orders-list';
import { MerchantOrderService } from '../../../../services/merchant-order-service';
import { MerchantOrderItemResponse } from '../../../../models/merchant-order-item-response';

describe('OrdersList', () => {
  let component: OrdersList;
  let fixture: ComponentFixture<OrdersList>;

  const sampleOrders: MerchantOrderItemResponse[] = [
    {
      orderId: 1, productName: 'Shirt', size: 'L', quantity: 1,
      unitPrice: 10, subtotal: 10, orderStatus: 'DELIVERED',
      orderDate: '2026-08-01', buyerFirstName: 'A', buyerLastName: 'B'
    },
    {
      orderId: 2, productName: 'Jeans', size: 'M', quantity: 2,
      unitPrice: 20, subtotal: 40, orderStatus: 'PENDING',
      orderDate: '2026-08-02', buyerFirstName: 'C', buyerLastName: 'D'
    }
  ];

  const mockOrderService = {
    getMerchantOrders: vi.fn().mockReturnValue(of(sampleOrders)),
    updateOrderStatus: vi.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersList],
      providers: [{ provide: MerchantOrderService, useValue: mockOrderService }]
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load orders from the service on init', () => {
    expect(component.orders).toHaveLength(2);
    expect(component.isLoading).toBe(false);
  });

  it('filteredOrders should return all orders when "ALL" is selected', () => {
    component.selectedStatus = 'ALL';
    expect(component.filteredOrders).toHaveLength(2);
  });

  it('filteredOrders should return only matching orders when a status tab is selected', () => {
    component.selectStatus('PENDING');
    expect(component.filteredOrders).toHaveLength(1);
    expect(component.filteredOrders[0].orderStatus).toBe('PENDING');
  });

  it('markAsPacked updates the order status locally when the request succeeds', () => {
  const orderToUpdate = component.orders[1];
  mockOrderService.updateOrderStatus.mockReturnValue(of({ orderId: 2, status: 'PACKED' }));

  component.markAsPacked(orderToUpdate);

  expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(2, 'PACKED');
  expect(orderToUpdate.orderStatus).toBe('PACKED');
  expect(component.updatingOrderId).toBeNull();
});

it('markAsPacked shows an error message and resets the button when the request fails', () => {
  const orderToUpdate = component.orders[1];
  mockOrderService.updateOrderStatus.mockReturnValue(
    throwError(() => ({ error: { message: 'Could not update the order. Please try again.' } }))
  );

  component.markAsPacked(orderToUpdate);

  expect(component.errorMessage).toBe('Could not update the order. Please try again.');
  expect(component.updatingOrderId).toBeNull();
});

it('showActionColumn is true only for the "ALL" and "PAID" tabs', () => {
  component.selectedStatus = 'ALL';
  expect(component.showActionColumn).toBe(true);

  component.selectedStatus = 'PAID';
  expect(component.showActionColumn).toBe(true);

  component.selectedStatus = 'PACKED';
  expect(component.showActionColumn).toBe(false);
});
});