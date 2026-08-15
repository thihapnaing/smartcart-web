// This file tests ProductDetail on its own, without drawing the page on screen.
// "Testing on its own" means: real product-detail.ts code runs, but its three
// helpers (ActivatedRoute, Router, ProductService, CartService) are replaced with
// stand-ins built with vi.fn(). A stand-in is a fake version of something that
// records how it was called, so a test can check "was addToCart called with the
// right size and quantity?" without needing a real server to talk to.
//
// Every public method on the component gets at least one test, and every
// if/else branch inside those methods gets exercised at least once. That is
// what "code path coverage" measures: not just that a method ran, but that
// each of its decision points was reached during the tests.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';

import { ProductDetail } from './product-detail';
import { ProductService } from '../../services/product';
import { CartService } from '../../services/cart';
import { ProductDetailResponse } from '../../models/product-detail-response';

describe('ProductDetail', () => {
  let component: ProductDetail;
  let mockProductService: { getProductById: ReturnType<typeof vi.fn> };
  let mockCartService: { addToCart: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  // A Subject is an observable that a test can push new values into whenever
  // it wants, using .next(...). The real ActivatedRoute.paramMap is also an
  // observable, so this stands in for "the address bar just changed to a
  // different product id".
  let paramMapSubject: Subject<ReturnType<typeof convertToParamMap>>;

  // One sample product reused across most tests. "as ProductDetailResponse"
  // tells TypeScript to trust this shape without checking the exact allowed
  // values for gender/status, since only their string values matter here.
  const sampleProduct = {
    productId: 1,
    name: 'Classic Tee',
    description: 'A comfortable everyday t-shirt.',
    price: 29.9,
    imageUrl: 'tee.jpg',
    gender: 'MEN',
    categoryName: 'Tops',
    shopName: 'SmartCartel Official',
    status: 'ACTIVE',
    variants: [
      { productVariantId: 10, size: 'L', stock: 5 },
      { productVariantId: 11, size: 'S', stock: 0 },
      { productVariantId: 12, size: 'M', stock: 3 },
    ],
  } as ProductDetailResponse;

  // Runs before every single test, so each test starts from a clean slate
  // instead of carrying over state from the test before it.
  beforeEach(() => {
    paramMapSubject = new Subject();

    mockProductService = {
      getProductById: vi.fn().mockReturnValue(of(sampleProduct)),
    };
    mockCartService = {
      addToCart: vi.fn().mockReturnValue(of({})),
    };
    mockRouter = {
      navigate: vi.fn(),
    };

    // TestBed builds the component using dependency injection, the same way
    // Angular does when the real app runs, except every dependency here is
    // one of the fakes above instead of the real service.
    TestBed.configureTestingModule({
      providers: [
        ProductDetail,
        { provide: ActivatedRoute, useValue: { paramMap: paramMapSubject.asObservable() } },
        { provide: Router, useValue: mockRouter },
        { provide: ProductService, useValue: mockProductService },
        { provide: CartService, useValue: mockCartService },
      ],
    });

    component = TestBed.inject(ProductDetail);
  });

  // Small helper so tests can simulate "the address bar now shows this id"
  // in one line instead of repeating the same three lines everywhere.
  function emitId(id: number): void {
    paramMapSubject.next(convertToParamMap({ id: String(id) }));
  }

  // Shared by every test in the "template rendering" groups below. Unlike
  // TestBed.inject(...) used above, TestBed.createComponent(...) actually
  // draws product-detail.html on screen, so the @if / @else blocks inside
  // that file run too. That is what moves product-detail.html's coverage
  // off 0%.
  function createAndRender() {
    const fixture = TestBed.createComponent(ProductDetail);
    fixture.detectChanges(); // runs ngOnInit and draws the initial "loading" view
    return fixture;
  }

  describe('ngOnInit / loading a product', () => {
    it('fetches the product for the id in the route and stores it', () => {
      component.ngOnInit();
      emitId(1);

      expect(mockProductService.getProductById).toHaveBeenCalledWith(1);
      expect(component.product()).toEqual(sampleProduct);
    });

    it('pre-selects the smallest in-stock size', () => {
      component.ngOnInit();
      emitId(1);

      // Sizes in stock order: S (0 stock, skipped), M (3, chosen), L (5).
      expect(component.selectedVariant()?.size).toBe('M');
    });

    it('leaves no size selected when every size is out of stock', () => {
      const outOfStockProduct = {
        ...sampleProduct,
        variants: [
          { productVariantId: 20, size: 'S', stock: 0 },
          { productVariantId: 21, size: 'M', stock: 0 },
        ],
      } as ProductDetailResponse;
      mockProductService.getProductById.mockReturnValue(of(outOfStockProduct));

      component.ngOnInit();
      emitId(2);

      expect(component.selectedVariant()).toBeNull();
    });

    it('resets old selections when the route id changes to a different product', () => {
      component.ngOnInit();
      emitId(1);

      // Simulate a shopper having already made choices on product 1.
      component.selectVariant(component.sortedVariants()[0]);
      component.quantity.set(2);
      component.addedMessage.set('Please select a size first.');
      component.justAdded.set(true);
      component.priceAlertSet.set(true);

      const secondProduct = {
        ...sampleProduct,
        productId: 2,
        variants: [{ productVariantId: 30, size: 'M', stock: 2 }],
      } as ProductDetailResponse;
      mockProductService.getProductById.mockReturnValue(of(secondProduct));

      emitId(2);

      expect(component.quantity()).toBe(1);
      expect(component.addedMessage()).toBe('');
      expect(component.justAdded()).toBe(false);
      expect(component.priceAlertSet()).toBe(false);
      // The new product's own pre-selection still runs after the reset.
      expect(component.selectedVariant()?.productVariantId).toBe(30);
    });
  });

  describe('sortedVariants', () => {
    it('orders known sizes from smallest to largest', () => {
      component.ngOnInit();
      emitId(1);

      expect(component.sortedVariants().map(v => v.size)).toEqual(['S', 'M', 'L']);
    });

    it('places a size that is not in the known size list at the end', () => {
      const oddSizeProduct = {
        ...sampleProduct,
        variants: [
          { productVariantId: 40, size: 'ONE SIZE', stock: 4 },
          { productVariantId: 41, size: 'S', stock: 2 },
        ],
      } as ProductDetailResponse;
      mockProductService.getProductById.mockReturnValue(of(oddSizeProduct));

      component.ngOnInit();
      emitId(3);

      expect(component.sortedVariants().map(v => v.size)).toEqual(['S', 'ONE SIZE']);
    });

    it('does not change the order of the original variants list', () => {
      component.ngOnInit();
      emitId(1);

      const beforeSort = component.product()!.variants.map(v => v.size);
      component.sortedVariants();

      expect(component.product()!.variants.map(v => v.size)).toEqual(beforeSort);
    });

    it('returns an empty list before any product has loaded', () => {
      expect(component.sortedVariants()).toEqual([]);
    });

    it('returns an empty list when the loaded product has no variants field', () => {
      const noVariants = { ...sampleProduct, variants: undefined } as unknown as ProductDetailResponse;
      mockProductService.getProductById.mockReturnValue(of(noVariants));

      component.ngOnInit();
      emitId(4);

      expect(component.sortedVariants()).toEqual([]);
    });
  });

  describe('hasVariants', () => {
    it('is false before any product has loaded', () => {
      expect(component.hasVariants()).toBe(false);
    });

    it('is true once a product with sizes has loaded', () => {
      component.ngOnInit();
      emitId(1);

      expect(component.hasVariants()).toBe(true);
    });

    it('is false when the loaded product has an empty size list', () => {
      const emptyVariants = { ...sampleProduct, variants: [] } as ProductDetailResponse;
      mockProductService.getProductById.mockReturnValue(of(emptyVariants));

      component.ngOnInit();
      emitId(5);

      expect(component.hasVariants()).toBe(false);
    });
  });

  describe('genderLabel', () => {
    it('is an empty string before any product has loaded', () => {
      expect(component.genderLabel()).toBe('');
    });

    it('shows "Men" for a MEN product', () => {
      component.ngOnInit();
      emitId(1); // sampleProduct.gender is 'MEN'

      expect(component.genderLabel()).toBe('Men');
    });

    it('shows "Women" for a WOMEN product', () => {
      const womenProduct = { ...sampleProduct, gender: 'WOMEN' } as ProductDetailResponse;
      mockProductService.getProductById.mockReturnValue(of(womenProduct));

      component.ngOnInit();
      emitId(6);

      expect(component.genderLabel()).toBe('Women');
    });
  });

  describe('choosing a size and adjusting quantity', () => {
    beforeEach(() => {
      component.ngOnInit();
      emitId(1);
    });

    it('selectVariant stores the size, clears any message, and resets quantity to 1', () => {
      component.quantity.set(3);
      component.addedMessage.set('Please select a size first.');

      const lSize = component.sortedVariants().find(v => v.size === 'L')!;
      component.selectVariant(lSize);

      expect(component.selectedVariant()).toEqual(lSize);
      expect(component.addedMessage()).toBe('');
      expect(component.quantity()).toBe(1);
    });

    it('maxQuantity matches the stock of the selected size', () => {
      const lSize = component.sortedVariants().find(v => v.size === 'L')!; // stock 5
      component.selectVariant(lSize);

      expect(component.maxQuantity()).toBe(5);
    });

    it('maxQuantity is 1 when no size has been selected yet', () => {
      component.selectedVariant.set(null);

      expect(component.maxQuantity()).toBe(1);
    });

    it('increaseQuantity adds one at a time, up to the stock limit', () => {
      const mSize = component.sortedVariants().find(v => v.size === 'M')!; // stock 3
      component.selectVariant(mSize);

      component.increaseQuantity();
      component.increaseQuantity();
      expect(component.quantity()).toBe(3);

      // A further click should have no effect once the stock limit is reached.
      component.increaseQuantity();
      expect(component.quantity()).toBe(3);
    });

    it('decreaseQuantity subtracts one at a time, but never below 1', () => {
      const mSize = component.sortedVariants().find(v => v.size === 'M')!;
      component.selectVariant(mSize);
      component.quantity.set(2);

      component.decreaseQuantity();
      expect(component.quantity()).toBe(1);

      // A further click should have no effect once quantity is already 1.
      component.decreaseQuantity();
      expect(component.quantity()).toBe(1);
    });
  });

  describe('togglePriceAlert', () => {
    it('switches between on and off each time it is called', () => {
      expect(component.priceAlertSet()).toBe(false);

      component.togglePriceAlert();
      expect(component.priceAlertSet()).toBe(true);

      component.togglePriceAlert();
      expect(component.priceAlertSet()).toBe(false);
    });
  });

  describe('addToCart', () => {
    beforeEach(() => {
      component.ngOnInit();
      emitId(1);
    });

    it('shows a message and does not call the cart service when no size is selected', () => {
      component.selectedVariant.set(null);

      component.addToCart();

      expect(mockCartService.addToCart).not.toHaveBeenCalled();
      expect(component.addedMessage()).toBe('Please select a size first.');
    });

    it('adds the item, briefly shows "Added to cart!", then reverts to normal', () => {
      // Fake timers replace the browser's real clock with one the test
      // controls, so the 1.4-second wait in the component does not need
      // to actually be waited out while the test runs.
      vi.useFakeTimers();

      const mSize = component.sortedVariants().find(v => v.size === 'M')!;
      component.selectVariant(mSize);
      component.quantity.set(2);

      component.addToCart();

      expect(mockCartService.addToCart).toHaveBeenCalledWith(mSize.productVariantId, 2);
      expect(component.justAdded()).toBe(true);
      expect(component.addedMessage()).toBe('');

      vi.advanceTimersByTime(1400);
      expect(component.justAdded()).toBe(false);

      vi.useRealTimers();
    });

    it('shows an error message when the cart service call fails', () => {
      mockCartService.addToCart.mockReturnValue(throwError(() => new Error('network error')));

      const mSize = component.sortedVariants().find(v => v.size === 'M')!;
      component.selectVariant(mSize);

      component.addToCart();

      expect(component.addedMessage()).toBe('Something went wrong. Please try again.');
    });
  });

  describe('buyNow', () => {
    beforeEach(() => {
      component.ngOnInit();
      emitId(1);
    });

    it('shows a message and does not navigate when no size is selected', () => {
      component.selectedVariant.set(null);

      component.buyNow();

      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(component.addedMessage()).toBe('Please select a size first.');
    });

    it('adds the item to the cart and goes to checkout when it succeeds', () => {
      const mSize = component.sortedVariants().find(v => v.size === 'M')!;
      component.selectVariant(mSize);

      component.buyNow();

      expect(mockCartService.addToCart).toHaveBeenCalledWith(mSize.productVariantId, 1);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/checkout']);
    });

    it('shows an error message and does not navigate when the cart service call fails', () => {
      mockCartService.addToCart.mockReturnValue(throwError(() => new Error('network error')));

      const mSize = component.sortedVariants().find(v => v.size === 'M')!;
      component.selectVariant(mSize);

      component.buyNow();

      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(component.addedMessage()).toBe('Something went wrong. Please try again.');
    });
  });

  describe('goBack', () => {
    it('navigates back to the search page', () => {
      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/search']);
    });
  });

  // The tests above call component methods directly, which exercises every
  // branch in product-detail.ts but never actually draws the HTML template.
  // These tests render the real template so the @if / @else blocks inside
  // that file get run too.
  describe('template rendering', () => {
    it('shows a loading message before the product has arrived', () => {
      const fixture = createAndRender();

      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading product...');
    });

    it('shows the product details, size buttons, and quantity once loaded', () => {
      const fixture = createAndRender();
      emitId(1);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Classic Tee');
      expect(el.querySelectorAll('.size-btn')).toHaveLength(3);
      expect(el.querySelector('.qty-value')?.textContent?.trim()).toBe('1');
    });

    it('marks the pre-selected size button as active', () => {
      const fixture = createAndRender();
      emitId(1);
      fixture.detectChanges();

      const activeButton = (fixture.nativeElement as HTMLElement).querySelector('.size-btn.active');
      expect(activeButton?.textContent?.trim()).toBe('M');
    });

    it('shows "Currently unavailable" and hides the quantity section when there are no sizes', () => {
      const noVariants = { ...sampleProduct, variants: [] } as ProductDetailResponse;
      mockProductService.getProductById.mockReturnValue(of(noVariants));

      const fixture = createAndRender();
      emitId(5);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Currently unavailable');
      expect(el.querySelector('.qty-row')).toBeNull();
    });

    it('shows "Added to cart!" on the button right after a successful add', () => {
      const fixture = createAndRender();
      emitId(1);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const addButton = el.querySelector('.btn-primary') as HTMLButtonElement;
      addButton.click();
      fixture.detectChanges();

      expect(addButton.textContent?.trim()).toBe('Added to cart!');
    });

    it('switches the price alert button text when clicked', () => {
      const fixture = createAndRender();
      emitId(1);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const alertButton = el.querySelector('.btn-alert') as HTMLButtonElement;
      expect(alertButton.textContent?.trim()).toBe('Set price alert');

      alertButton.click();
      fixture.detectChanges();

      expect(alertButton.textContent?.trim()).toBe('Price alert set');
    });

    it('shows the "select a size first" message when adding to cart with no size selected', () => {
      const noStockProduct = {
        ...sampleProduct,
        variants: [{ productVariantId: 50, size: 'S', stock: 0 }],
      } as ProductDetailResponse;
      mockProductService.getProductById.mockReturnValue(of(noStockProduct));

      const fixture = createAndRender();
      emitId(7);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      (el.querySelector('.btn-primary') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(el.textContent).toContain('Please select a size first.');
    });
  });

  // These tests cover a few interactions that were previously only exercised
  // by calling the component's methods directly (see "buyNow" and "choosing
  // a size and adjusting quantity" above). Clicking the real buttons in the
  // rendered template gives the same methods extra coverage through the
  // template's own click bindings and disabled-state bindings.
  describe('template rendering — buy now and quantity buttons', () => {
    it('navigates to checkout when the "Buy now" button is clicked', () => {
      const fixture = createAndRender();
      emitId(1);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      (el.querySelector('.btn-secondary') as HTMLButtonElement).click();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/checkout']);
    });

    it('lets a shopper change the quantity using the + and - buttons, disabling them at the stock limits', () => {
      const fixture = createAndRender();
      emitId(1);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const [decreaseButton, increaseButton] = Array.from(
        el.querySelectorAll('.qty-step-btn')
      ) as HTMLButtonElement[];
      const quantityText = () => el.querySelector('.qty-value')?.textContent?.trim();

      // Pre-selected size is M, which has 3 in stock, so quantity starts at 1
      // and the "-" button should already be disabled.
      expect(quantityText()).toBe('1');
      expect(decreaseButton.disabled).toBe(true);
      expect(increaseButton.disabled).toBe(false);

      increaseButton.click();
      fixture.detectChanges();
      increaseButton.click();
      fixture.detectChanges();
      expect(quantityText()).toBe('3');
      // The stock limit (3) has been reached, so the "+" button disables itself.
      expect(increaseButton.disabled).toBe(true);

      decreaseButton.click();
      fixture.detectChanges();
      expect(quantityText()).toBe('2');
      expect(decreaseButton.disabled).toBe(false);
    });

    it('renders an out-of-stock size button as disabled', () => {
      const fixture = createAndRender();
      emitId(1);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const sizeButtons = Array.from(el.querySelectorAll('.size-btn')) as HTMLButtonElement[];
      const sButton = sizeButtons.find(button => button.textContent?.trim() === 'S');

      // sampleProduct's "S" size has 0 stock.
      expect(sButton?.disabled).toBe(true);
    });
  });
});
