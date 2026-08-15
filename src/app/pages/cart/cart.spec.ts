import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { CartComponent } from './cart';
import { CartService } from '../../services/cart';
import { CartItemDetail } from '../../models/cart-item-detail';
import { CartItemsResponse } from '../../models/cart-items-response';

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;
  // Vitest has no SpyObj type like Jasmine — we just describe the shape
  // of methods-as-mocks ourselves.
  let cartServiceSpy: {
    refresh: Mock;
    updateQuantity: Mock;
    items: ReturnType<typeof signal<CartItemDetail[]>>;
    itemCount: ReturnType<typeof signal<number>>;
    cartTotal: ReturnType<typeof signal<number>>;
  };
  let routerSpy: { navigate: Mock };

  const mockItem: CartItemDetail = {
    cartItemId: 1,
    productVariantId: 10,
    productName: 'Test Product',
    imageUrl: 'https://example.com/image.jpg',
    size: 'M',
    unitPrice: 10,
    quantity: 2,
    subtotal: 20,
    gender: 'unisex',
    categoryName: 'Test Category',
    shopName: 'Test Shop',
  };

  const mockResponse: CartItemsResponse = {
    cartItemDetails: [mockItem],
    cartTotal: 20,
  };

  beforeEach(async () => {
    cartServiceSpy = {
      refresh: vi.fn(),
      updateQuantity: vi.fn(),

      items: signal<CartItemDetail[]>([]),
      itemCount: signal<number>(0),
      cartTotal: signal<number>(0),
    };

    cartServiceSpy.updateQuantity.mockReturnValue(of(mockResponse));

    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CartComponent],
      providers: [
        { provide: CartService, useValue: cartServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should refresh the cart so /cart works when opened directly', () => {
      fixture.detectChanges();
      expect(cartServiceSpy.refresh).toHaveBeenCalled();
    });
  });

  describe('increment', () => {
    it('should call updateQuantity with quantity + 1', () => {
      component.increment(mockItem);
      expect(cartServiceSpy.updateQuantity).toHaveBeenCalledWith(1, 3);
    });
  });

  describe('decrement', () => {
    it('should call updateQuantity with quantity - 1', () => {
      component.decrement(mockItem);
      expect(cartServiceSpy.updateQuantity).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('changeQuantity', () => {
    it('should call updateQuantity with quantity + delta', () => {
      component.changeQuantity(mockItem, 5);
      expect(cartServiceSpy.updateQuantity).toHaveBeenCalledWith(1, 7);
    });

    it('should support negative deltas', () => {
      component.changeQuantity(mockItem, -1);
      expect(cartServiceSpy.updateQuantity).toHaveBeenCalledWith(1, 1);
    });

    it('should log an error if updateQuantity fails', () => {
      cartServiceSpy.updateQuantity.mockReturnValue(throwError(() => new Error('fail')));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      component.changeQuantity(mockItem, 1);

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('checkout', () => {
    it('should navigate to /checkout', () => {
      component.checkout();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/checkout']);
    });
  });

  describe('goToHomepage', () => {
    it('should navigate to /', () => {
      component.goToHomepage();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('template', () => {
    it('should show the empty-cart message when there are no items', () => {
      cartServiceSpy.items.set([]);
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Your cart is empty.');
      expect(fixture.nativeElement.querySelector('.cart-item')).toBeNull();
    });

    it('should render one row per cart item with its details', () => {
      cartServiceSpy.items.set([mockItem]);
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('.cart-item');
      expect(rows).toHaveLength(1);

      const text = fixture.nativeElement.textContent;
      expect(text).toContain(mockItem.productName);
      expect(text).toContain(mockItem.shopName);
      expect(text).toContain(mockItem.categoryName.toUpperCase());
    });

    it('should show the item count in the header', () => {
      cartServiceSpy.items.set([mockItem]);
      fixture.detectChanges();

      const header = fixture.nativeElement.querySelector('.cart-count');
      expect(header.textContent).toContain('1');
    });

    it('should call changeQuantity(item, -1) when the minus button is clicked', () => {
      cartServiceSpy.items.set([mockItem]);
      fixture.detectChanges();

      const minusBtn = fixture.nativeElement.querySelectorAll('.qty-stepper__btn')[0];
      minusBtn.click();

      expect(cartServiceSpy.updateQuantity).toHaveBeenCalledWith(1, mockItem.quantity - 1);
    });

    it('should call changeQuantity(item, 1) when the plus button is clicked', () => {
      cartServiceSpy.items.set([mockItem]);
      fixture.detectChanges();

      const plusBtn = fixture.nativeElement.querySelectorAll('.qty-stepper__btn')[1];
      plusBtn.click();

      expect(cartServiceSpy.updateQuantity).toHaveBeenCalledWith(1, mockItem.quantity + 1);
    });

    it('should call checkout() when "Proceed to checkout" is clicked', () => {
      cartServiceSpy.items.set([mockItem]);
      fixture.detectChanges();

      const checkoutBtn = fixture.debugElement.query(By.css('.btn--primary'));
      checkoutBtn.nativeElement.click();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/checkout']);
    });

    it('should call goToHomepage() when "Continue shopping" is clicked', () => {
      cartServiceSpy.items.set([mockItem]);
      fixture.detectChanges();

      const continueBtn = fixture.debugElement.query(By.css('.btn--ghost'));
      continueBtn.nativeElement.click();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should format the subtotal and cart total with 2 decimal places', () => {
      cartServiceSpy.items.set([mockItem]);
      cartServiceSpy.cartTotal.set(mockItem.subtotal);
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain(`S$${mockItem.subtotal.toFixed(2)}`);
    });
  });
});