import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { OrderConfirmationComponent } from './order-confirmation';

describe('OrderConfirmationComponent', () => {
  let component: OrderConfirmationComponent;
  let fixture: ComponentFixture<OrderConfirmationComponent>;

  // A full order with delivery details and one item filled in,
  // matching everything the template reads from "order" and "order.cartItemDetails".
  const orders = [
    {
      orderId: 1,
      orderNumber: 'ORD-001',
      orderDate: '2026-08-15',
      totalAmount: 50,
      paymentMethod: 'CREDIT_CARD',
      deliveryDetails: {
        firstName: 'Jane',
        lastName: 'Tan',
        shippingAddress: '123 Orchard Road, #01-01, Singapore 238888',
        phoneNumber: '91234567'
      },
      cartItemDetails: [
        {
          cartItemId: 1,
          shopName: 'SmartCart Official',
          imageUrl: 'https://example.com/image.jpg',
          productName: 'Classic White Tee',
          size: 'M',
          quantity: 2,
          subtotal: 50
        }
      ]
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
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should show the loading message when no orders are provided in history state', () => {
    window.history.replaceState({}, '');

    fixture = TestBed.createComponent(OrderConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component['orders']()).toEqual([]);
  });

  it('should load orders from history state and render the full order details', () => {
    window.history.replaceState({ orders }, '');

    fixture = TestBed.createComponent(OrderConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component['orders']()).toEqual(orders);
  });

  const paymentMethodCases: Array<[input: string, expected: string]> = [
    ['CREDIT_CARD', 'Credit Card'],
    ['PAY_NOW', 'PayNow'],
    ['CASH', 'CASH'] // unknown method falls back to the original value
  ];

  paymentMethodCases.forEach(([input, expected]) => {
    it(`should return "${expected}" label for payment method "${input}"`, () => {
      fixture = TestBed.createComponent(OrderConfirmationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.getPaymentMethodLabel(input)).toBe(expected);
    });
  });
});