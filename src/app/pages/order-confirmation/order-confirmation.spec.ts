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

    fixture = TestBed.createComponent(OrderConfirmationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
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

  const paymentMethodCases: Array<[input: string, expected: string]> = [
    ['CREDIT_CARD', 'Credit Card'],
    ['PAY_NOW', 'PayNow'],
    ['CASH', 'CASH'] // unknown method falls back to the original value
  ];

  paymentMethodCases.forEach(([input, expected]) => {
    it(`should return "${expected}" label for payment method "${input}"`, () => {
      expect(component.getPaymentMethodLabel(input)).toBe(expected);
    });
  });
});