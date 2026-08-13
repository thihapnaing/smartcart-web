import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ProductMiniCard } from './product-mini-card';
import { CartService } from '../../../../services/cart';
import { ProductSummary } from '../../models/chat.model';

describe('ProductMiniCard', () => {
  let fixture: ComponentFixture<ProductMiniCard>;
  let component: ProductMiniCard;
  let cartService: {
    quantityFor: ReturnType<typeof vi.fn>;
    cartItemIdFor: ReturnType<typeof vi.fn>;
    addToCart: ReturnType<typeof vi.fn>;
    updateQuantity: ReturnType<typeof vi.fn>;
  };

  const product: ProductSummary = {
    productId: 1,
    name: 'Tee',
    price: 19.99,
    imageUrl: 'tee.jpg',
    category: 'Tops',
    defaultVariantId: 5,
  };

  const setup = () => {
    fixture = TestBed.createComponent(ProductMiniCard);
    component = fixture.componentInstance;
    component.product = product;
  };

  beforeEach(async () => {
    cartService = {
      quantityFor: vi.fn().mockReturnValue(0),
      cartItemIdFor: vi.fn().mockReturnValue(null),
      addToCart: vi.fn().mockReturnValue(of(undefined)),
      updateQuantity: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [ProductMiniCard],
      providers: [provideRouter([]), { provide: CartService, useValue: cartService }],
    }).compileComponents();
  });

  it('should create', () => {
    setup();
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  describe('quantity', () => {
    it('is 0 when the product has no default variant', () => {
      setup();
      component.product = { ...product, defaultVariantId: null };

      expect(component.quantity()).toBe(0);
      expect(cartService.quantityFor).not.toHaveBeenCalled();
    });

    it('reads the quantity for the default variant from CartService', () => {
      cartService.quantityFor.mockReturnValue(3);
      setup();

      expect(component.quantity()).toBe(3);
      expect(cartService.quantityFor).toHaveBeenCalledWith(5);
    });
  });

  describe('addToCart', () => {
    it('does nothing when the product has no default variant', () => {
      setup();
      component.product = { ...product, defaultVariantId: null };

      component.addToCart();

      expect(cartService.addToCart).not.toHaveBeenCalled();
    });

    it('adds the default variant to the cart', () => {
      setup();

      component.addToCart();

      expect(cartService.addToCart).toHaveBeenCalledWith(5);
    });
  });

  describe('increment', () => {
    it('adds to cart when the product is not in the cart yet', () => {
      cartService.cartItemIdFor.mockReturnValue(null);
      setup();

      component.increment();

      expect(cartService.addToCart).toHaveBeenCalledWith(5);
      expect(cartService.updateQuantity).not.toHaveBeenCalled();
    });

    it('bumps the existing line item quantity by one', () => {
      cartService.cartItemIdFor.mockReturnValue(42);
      cartService.quantityFor.mockReturnValue(2);
      setup();

      component.increment();

      expect(cartService.updateQuantity).toHaveBeenCalledWith(42, 3);
    });
  });

  describe('decrement', () => {
    it('does nothing when the product is not in the cart', () => {
      cartService.cartItemIdFor.mockReturnValue(null);
      setup();

      component.decrement();

      expect(cartService.updateQuantity).not.toHaveBeenCalled();
    });

    it('reduces the existing line item quantity by one', () => {
      cartService.cartItemIdFor.mockReturnValue(42);
      cartService.quantityFor.mockReturnValue(2);
      setup();

      component.decrement();

      expect(cartService.updateQuantity).toHaveBeenCalledWith(42, 1);
    });
  });

  describe('template', () => {
    it('shows the "+ Add" button when quantity is 0', () => {
      cartService.quantityFor.mockReturnValue(0);
      setup();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.add-btn')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.qty-stepper')).toBeFalsy();
    });

    it('shows the quantity stepper when quantity is greater than 0', () => {
      cartService.quantityFor.mockReturnValue(2);
      setup();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.add-btn')).toBeFalsy();
      const qtyValue = fixture.nativeElement.querySelector('.qty-value');
      expect(qtyValue.textContent.trim()).toBe('2');
    });
  });
});
