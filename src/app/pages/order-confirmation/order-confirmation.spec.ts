import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { OrderConfirmationComponent } from './order-confirmation';
import { OrderService } from '../../services/order';

describe('OrderConfirmationComponent', () => {
  let component: OrderConfirmationComponent;
  let fixture: ComponentFixture<OrderConfirmationComponent>;

  const orderService = {
    getOrderDetail: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    orderService.getOrderDetail.mockReturnValue(
      of({
        orderId: 1,
        cartItemDetails: [],
        totalAmount: 100,
        orderStatus: 'PAID',
        paymentMethod: 'PAY_NOW',
        deliveryDetails: {
          firstName: 'John',
          lastName: 'Tan',
          shippingAddress: '123 Orchard Road',
          phoneNumber: '91234567'
        }
      } as any)
    );

    await TestBed.configureTestingModule({
      imports: [OrderConfirmationComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                orderId: '1'
              }
            }
          }
        },
        {
          provide: OrderService,
          useValue: orderService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getOrderDetail on init', () => {
    expect(orderService.getOrderDetail).toHaveBeenCalledWith(1);
  });

  it('should return Credit Card label', () => {
    expect(component.getPaymentMethodLabel('CREDIT_CARD'))
      .toBe('Credit Card');
  });

  it('should return PayNow label', () => {
    expect(component.getPaymentMethodLabel('PAY_NOW'))
      .toBe('PayNow');
  });

  it('should return unknown payment method unchanged', () => {
    expect(component.getPaymentMethodLabel('BANK_TRANSFER'))
      .toBe('BANK_TRANSFER');
  });
});