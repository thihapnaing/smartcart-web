import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { of } from 'rxjs';
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
    getMerchantOrders: vi.fn().mockReturnValue(of(sampleOrders))
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

  it('filteredOrders should return all orders when "All" is selected', () => {
    component.selectedStatus = 'All';
    expect(component.filteredOrders).toHaveLength(2);
  });

  it('filteredOrders should return only matching orders when a status tab is selected', () => {
    component.selectStatus('Pending');
    expect(component.filteredOrders).toHaveLength(1);
    expect(component.filteredOrders[0].orderStatus).toBe('PENDING');
  });
});