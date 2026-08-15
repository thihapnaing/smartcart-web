import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { OrderConfirmationComponent } from './order-confirmation';

describe('OrderConfirmationComponent', () => {
  let component: OrderConfirmationComponent;
  let fixture: ComponentFixture<OrderConfirmationComponent>;

  const orders = [
    {
      orderId: 1,
      orderNumber: 'ORD-001',
      orderDate: '2026-08-15',
      totalAmount: 50,
      paymentMethod: 'CREDIT_CARD',
      cartItemDetails: []
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderConfirmationComponent],
      providers: [
        provideRouter([])
      ]
    }).compileComponents();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(OrderConfirmationComponent);
    component = fixture.componentInstance;

    expect(component).toBeTruthy();
  });

  it('should load orders from history state on init', () => {
    window.history.replaceState({ orders }, '');

    fixture = TestBed.createComponent(OrderConfirmationComponent);
    component = fixture.componentInstance;

    component.ngOnInit();

    expect(component['orders']()).toEqual(orders);
  });

  it('should keep orders empty when no orders are provided in history state', () => {
    window.history.replaceState({}, '');

    fixture = TestBed.createComponent(OrderConfirmationComponent);
    component = fixture.componentInstance;

    component.ngOnInit();

    expect(component['orders']()).toEqual([]);
  });

  it('should return Credit Card for CREDIT_CARD', () => {
    fixture = TestBed.createComponent(OrderConfirmationComponent);
    component = fixture.componentInstance;

    expect(component.getPaymentMethodLabel('CREDIT_CARD'))
      .toBe('Credit Card');
  });

  it('should return PayNow for PAY_NOW', () => {
    fixture = TestBed.createComponent(OrderConfirmationComponent);
    component = fixture.componentInstance;

    expect(component.getPaymentMethodLabel('PAY_NOW'))
      .toBe('PayNow');
  });

  it('should return the original method for an unknown payment method', () => {
    fixture = TestBed.createComponent(OrderConfirmationComponent);
    component = fixture.componentInstance;

    expect(component.getPaymentMethodLabel('CASH'))
      .toBe('CASH');
  });
});