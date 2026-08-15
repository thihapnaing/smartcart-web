import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';

import { CheckoutComponent } from './checkout';
import { OrderService } from '../../services/order';
import { CartService } from '../../services/cart';
import { UserProfileService } from '../../services/user-profile';


describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;

  const mockCart = {
    cartItemDetails: [
      {
        cartItemId: 1,
        productName: 'Widget',
        imageUrl: 'widget.png',
        size: 'M',
        quantity: 2,
        subtotal: 19.98,
      },
      {
        cartItemId: 2,
        productName: 'Gadget',
        imageUrl: 'gadget.png',
        size: 'L',
        quantity: 1,
        subtotal: 9.99,
      },
    ],
    cartTotal: 29.97,
  };

  const mockProfile = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    address: '123 Analytical Engine Way',
    phoneNumber: '555-1234',
  };
  const mockCheckoutResponse = [{ orderId: 'ORD-1', status: 'CONFIRMED' }];

  let orderServiceMock: { checkout: ReturnType<typeof vi.fn> };
  let cartServiceMock: { getCart: ReturnType<typeof vi.fn> };
  let userProfileServiceMock: { getProfile: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    orderServiceMock = { checkout: vi.fn() };
    cartServiceMock = { getCart: vi.fn() };
    userProfileServiceMock = { getProfile: vi.fn() };
    routerMock = { navigate: vi.fn() };

    cartServiceMock.getCart.mockReturnValue(of(mockCart as any));
    userProfileServiceMock.getProfile.mockReturnValue(of(mockProfile as any));
    orderServiceMock.checkout.mockReturnValue(of(mockCheckoutResponse as any));

    await TestBed.configureTestingModule({
      imports: [CheckoutComponent, ReactiveFormsModule],
      providers: [
        { provide: OrderService, useValue: orderServiceMock },
        { provide: CartService, useValue: cartServiceMock },
        { provide: UserProfileService, useValue: userProfileServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit - cart loading', () => {
    it('should populate the cart signal when getCart succeeds', () => {
      fixture.detectChanges();
      expect(component.cart()).toEqual(mockCart as any);
    });

    it('should log an error and leave cart null when getCart fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      cartServiceMock.getCart.mockReturnValue(throwError(() => new Error('network down')));

      fixture.detectChanges();

      expect(component.cart()).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load cart', expect.any(Error));
    });
  });

  describe('ngOnInit - profile loading', () => {
    it('should pre-fill the form when getProfile succeeds', () => {
      fixture.detectChanges();

      expect(component.checkoutForm.value.firstName).toBe('Ada');
      expect(component.checkoutForm.value.lastName).toBe('Lovelace');
      expect(component.checkoutForm.value.shippingAddress).toBe('123 Analytical Engine Way');
      expect(component.checkoutForm.value.phoneNumber).toBe('555-1234');
    });

    it('should log an error and leave the form empty when getProfile fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      userProfileServiceMock.getProfile.mockReturnValue(throwError(() => new Error('profile down')));

      fixture.detectChanges();

      expect(component.checkoutForm.value.firstName).toBe('');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load profile', expect.any(Error));
    });
  });

  describe('selectPaymentMethod', () => {
    it('should set paymentMethod to CREDIT_CARD', () => {
      fixture.detectChanges();
      component.selectPaymentMethod('CREDIT_CARD');
      expect(component.checkoutForm.value.paymentMethod).toBe('CREDIT_CARD');
    });

    it('should set paymentMethod to PAY_NOW', () => {
      fixture.detectChanges();
      component.selectPaymentMethod('PAY_NOW');
      expect(component.checkoutForm.value.paymentMethod).toBe('PAY_NOW');
    });
  });

  describe('onSubmit - invalid form', () => {
    it('should mark all fields as touched and NOT call checkout', () => {
      fixture.detectChanges();
      const markAllAsTouchedSpy = vi.spyOn(component.checkoutForm, 'markAllAsTouched');

      component.onSubmit();

      expect(markAllAsTouchedSpy).toHaveBeenCalled();
      expect(orderServiceMock.checkout).not.toHaveBeenCalled();
    });
  });

  describe('onSubmit - valid form, checkout succeeds', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.checkoutForm.setValue({
        firstName: 'Ada',
        lastName: 'Lovelace',
        shippingAddress: '123 Analytical Engine Way',
        phoneNumber: '555-1234',
        paymentMethod: 'CREDIT_CARD',
        cardNumber: '4242 4242 4242 4242',
        expiry: '08/28',
        cvv: '123',
      });
    });

    it('should call orderService.checkout with the mapped request', () => {
      component.onSubmit();

      expect(orderServiceMock.checkout).toHaveBeenCalledWith({
        firstName: 'Ada',
        lastName: 'Lovelace',
        shippingAddress: '123 Analytical Engine Way',
        phoneNumber: '555-1234',
        paymentMethod: 'CREDIT_CARD',
      } as any);
    });

    it('should navigate to /order-confirmation with the order data on success', () => {
      component.onSubmit();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/order-confirmation'], {
        state: { orders: mockCheckoutResponse },
      });
    });
  });

  describe('onSubmit - valid form, checkout fails', () => {
    it('should log an error and NOT navigate when checkout fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      orderServiceMock.checkout.mockReturnValue(throwError(() => new Error('payment declined')));

      fixture.detectChanges();
      component.checkoutForm.setValue({
        firstName: 'Ada',
        lastName: 'Lovelace',
        shippingAddress: '123 Analytical Engine Way',
        phoneNumber: '555-1234',
        paymentMethod: 'CREDIT_CARD',
        cardNumber: '4242 4242 4242 4242',
        expiry: '08/28',
        cvv: '123',
      });

      component.onSubmit();

      expect(consoleSpy).toHaveBeenCalledWith('Checkout failed', expect.any(Error));
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Template - payment method buttons', () => {
    it('should show Credit Card button as outlined when no method is selected yet', () => {
      fixture.detectChanges();

      const creditCardBtn = fixture.debugElement.queryAll(By.css('button'))
        .find(b => b.nativeElement.textContent.trim() === 'Credit Card');

      expect(creditCardBtn?.nativeElement.className).toContain('btn--outline');
    });

    it('should highlight Credit Card button and show card fields when selected', () => {
      fixture.detectChanges();

      component.selectPaymentMethod('CREDIT_CARD');
      fixture.detectChanges(); 

      const creditCardBtn = fixture.debugElement.queryAll(By.css('button'))
        .find(b => b.nativeElement.textContent.trim() === 'Credit Card');
      expect(creditCardBtn?.nativeElement.className).toContain('btn--primary');

      const cardNumberInput = fixture.debugElement.query(By.css('#cardNumber'));
      expect(cardNumberInput).toBeTruthy();


      const qrPlaceholder = fixture.debugElement.query(By.css('.qr-placeholder'));
      expect(qrPlaceholder).toBeFalsy();
    });

    it('should highlight PayNow button and show the QR block when selected', () => {
      fixture.detectChanges();

      component.selectPaymentMethod('PAY_NOW');
      fixture.detectChanges();

      const payNowBtn = fixture.debugElement.queryAll(By.css('button'))
        .find(b => b.nativeElement.textContent.trim() === 'PayNow');
      expect(payNowBtn?.nativeElement.className).toContain('btn--primary');

      const qrPlaceholder = fixture.debugElement.query(By.css('.qr-placeholder'));
      expect(qrPlaceholder).toBeTruthy();

      // The CREDIT_CARD block should NOT be present
      const cardNumberInput = fixture.debugElement.query(By.css('#cardNumber'));
      expect(cardNumberInput).toBeFalsy();
    });

    it('should trigger selectPaymentMethod when the button is clicked in the DOM', () => {
      fixture.detectChanges();
      const selectSpy = vi.spyOn(component, 'selectPaymentMethod');

      const creditCardBtn = fixture.debugElement.queryAll(By.css('button'))
        .find(b => b.nativeElement.textContent.trim() === 'Credit Card');
      creditCardBtn?.nativeElement.click();

      expect(selectSpy).toHaveBeenCalledWith('CREDIT_CARD');
    });
  });

  describe('Template - order summary', () => {
    it('should show "Order(0)" and no summary rows while cart is still loading', () => {

      const pendingCart$ = new Subject();
      cartServiceMock.getCart.mockReturnValue(pendingCart$.asObservable());

      fixture.detectChanges();

      const header = fixture.debugElement.query(By.css('.order-summary h3'));
      expect(header.nativeElement.textContent).toContain('Order(0)');

      const divider = fixture.debugElement.query(By.css('.order-summary__divider'));
      expect(divider).toBeFalsy();
    });

    it('should render one row per cart item and the correct totals once cart loads', () => {
      fixture.detectChanges(); 

      const header = fixture.debugElement.query(By.css('.order-summary h3'));
      expect(header.nativeElement.textContent).toContain('Order(2)');

      const itemNames = fixture.debugElement.queryAll(By.css('.cart-item__name'));
      expect(itemNames).toHaveLength(2);
      expect(itemNames[0].nativeElement.textContent.trim()).toBe('Widget');
      expect(itemNames[1].nativeElement.textContent.trim()).toBe('Gadget');

      const totalRow = fixture.debugElement.query(By.css('.order-summary__total'));
      expect(totalRow.nativeElement.textContent).toContain('29.97');
    });

    it('should render "Order(0)" with $0.00 totals when cart has no items', () => {
      const emptyCart = { cartItemDetails: [], cartTotal: 0 };
      cartServiceMock.getCart.mockReturnValue(of(emptyCart as any));

      fixture.detectChanges();

      const header = fixture.debugElement.query(By.css('.order-summary h3'));
      expect(header.nativeElement.textContent).toContain('Order(0)');

      const itemNames = fixture.debugElement.queryAll(By.css('.cart-item__name'));
      expect(itemNames).toHaveLength(0);

      const totalRow = fixture.debugElement.query(By.css('.order-summary__total'));
      expect(totalRow).toBeTruthy();
      expect(totalRow.nativeElement.textContent).toContain('0.00');
    });
  });
});