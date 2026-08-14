import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { OrderMiniCard } from './order-mini-card';
import { CartService } from '../../../../services/cart';
import { OrderSummary } from '../../models/chat.model';

describe('OrderMiniCard', () => {
  let fixture: ComponentFixture<OrderMiniCard>;
  let component: OrderMiniCard;
  let cartService: { addToCart: ReturnType<typeof vi.fn> };

  const baseOrder: OrderSummary = {
    orderId: 101,
    orderNumber: 'SC-000101',
    totalAmount: 45.5,
    status: 'DELIVERED',
    orderDate: '2026-08-01',
    items: [
      { name: 'Tee', price: 19.9, imageUrl: 'tee.jpg', quantity: 1, productVariantId: 5 },
      { name: 'Sandals', price: 25.6, imageUrl: 'sandals.jpg', quantity: 1, productVariantId: 8 },
    ],
  };

  const setup = () => {
    fixture = TestBed.createComponent(OrderMiniCard);
    component = fixture.componentInstance;
    component.order = baseOrder;
  };

  beforeEach(async () => {
    cartService = { addToCart: vi.fn().mockReturnValue(of(undefined)) };

    await TestBed.configureTestingModule({
      imports: [OrderMiniCard],
      providers: [{ provide: CartService, useValue: cartService }],
    }).compileComponents();
  });

  it('should create', () => {
    setup();
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  describe('statusLabel', () => {
    it.each([
      { description: 'is missing', status: '', expected: '' },
      { description: 'is upper-case', status: 'DELIVERED', expected: 'Delivered' },
      { description: 'is already mixed-case', status: 'Pending', expected: 'Pending' },
    ])('returns "$expected" when status $description', ({ status, expected }) => {
      setup();
      component.order = { ...baseOrder, status };

      expect(component.statusLabel).toBe(expected);
    });
  });

  describe('itemCount', () => {
    it('is 0 when items is null', () => {
      setup();
      component.order = { ...baseOrder, items: null };

      expect(component.itemCount).toBe(0);
    });

    it('reflects the number of items', () => {
      setup();

      expect(component.itemCount).toBe(2);
    });
  });

  describe('template', () => {
    it('renders the order number, total, status, and item names', () => {
      setup();
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('SC-000101');
      expect(text).toContain('Delivered');
      expect(text).toContain('S$45.50');
      expect(text).toContain('Tee');
      expect(text).toContain('Sandals');
    });

    it('does not render an items list when there are no items', () => {
      setup();
      component.order = { ...baseOrder, items: null };
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.order-card__items')).toBeFalsy();
    });
  });

  describe('buyAgain', () => {
    it('does nothing when there are no items with a known variant', () => {
      setup();
      component.order = {
        ...baseOrder,
        items: [{ name: 'Mystery', price: 10, imageUrl: '', quantity: 1, productVariantId: null }],
      };

      component.buyAgain();

      expect(cartService.addToCart).not.toHaveBeenCalled();
    });

    it('adds every item with a known variant to the cart at its original quantity', () => {
      setup();
      component.order = {
        ...baseOrder,
        items: [
          { name: 'Tee', price: 19.9, imageUrl: 'tee.jpg', quantity: 2, productVariantId: 5 },
          { name: 'Sandals', price: 25.6, imageUrl: 'sandals.jpg', quantity: 1, productVariantId: 8 },
        ],
      };

      component.buyAgain();

      expect(cartService.addToCart).toHaveBeenCalledWith(5, 2);
      expect(cartService.addToCart).toHaveBeenCalledWith(8, 1);
    });

    it('adds items strictly one at a time, not in parallel - the second call only fires after the first settles', () => {
      // Regression test: firing every addToCart call in parallel let their responses race, so
      // CartService.items could end up reflecting whichever response arrived last - not
      // necessarily the one with every item added. Each response here is held open via a
      // Subject until the test explicitly emits, so this fails if buyAgain ever goes back to
      // firing all requests up front instead of chaining them with concatMap.
      const first = new Subject<undefined>();
      const second = new Subject<undefined>();
      cartService.addToCart.mockReturnValueOnce(first).mockReturnValueOnce(second);
      setup();
      component.order = {
        ...baseOrder,
        items: [
          { name: 'Tee', price: 19.9, imageUrl: 'tee.jpg', quantity: 2, productVariantId: 5 },
          { name: 'Sandals', price: 25.6, imageUrl: 'sandals.jpg', quantity: 1, productVariantId: 8 },
        ],
      };

      component.buyAgain();

      expect(cartService.addToCart).toHaveBeenCalledTimes(1);
      expect(cartService.addToCart).toHaveBeenCalledWith(5, 2);

      first.next(undefined);
      first.complete();

      expect(cartService.addToCart).toHaveBeenCalledTimes(2);
      expect(cartService.addToCart).toHaveBeenCalledWith(8, 1);
      expect(component.buying()).toBe(true);

      second.next(undefined);
      second.complete();

      expect(component.buying()).toBe(false);
    });

    it('does nothing while a buyAgain call is already in flight', () => {
      setup();
      component.buying.set(true);

      component.buyAgain();

      expect(cartService.addToCart).not.toHaveBeenCalled();
    });

    it('resets buying back to false once every add-to-cart call settles, including failures', () => {
      cartService.addToCart
        .mockReturnValueOnce(of(undefined))
        .mockReturnValueOnce(throwError(() => new Error('boom')));
      setup();

      component.buyAgain();

      expect(component.buying()).toBe(false);
    });
  });
});
