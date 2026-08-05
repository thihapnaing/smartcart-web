import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { CheckoutComponent } from './checkout';
import { CartService } from '../../services/cart';
import { OrderService } from '../../services/order';

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;

  const router = {
    navigate: vi.fn()
  };

  const cartService = {
    getCart: vi.fn()
  };

  const orderService = {
    checkout: vi.fn()
  };

  beforeEach(async () => {
    // Reset spies between tests
    vi.clearAllMocks();

    cartService.getCart.mockReturnValue(
      of({
        cartItemDetails: [],
        cartTotal: 0
      })
    );

    orderService.checkout.mockReturnValue(
      of({
        orderId: 1
      })
    );

    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        FormBuilder,
        { provide: Router, useValue: router },
        { provide: CartService, useValue: cartService },
        { provide: OrderService, useValue: orderService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set payment method', () => {
    component.selectPaymentMethod('PAY_NOW');

    expect(component.checkoutForm.value.paymentMethod).toBe('PAY_NOW');
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();

    expect(orderService.checkout).not.toHaveBeenCalled();
  });
});