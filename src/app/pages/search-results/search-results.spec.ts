// This file tests SearchResults on its own, the same way product-detail.spec.ts
// tests ProductDetail: the real search-results.ts code runs, but ProductService
// and ActivatedRoute are replaced with stand-ins so no real server call happens.
//
// buildPageTitle() and formatGender() are marked private in the component, so
// they cannot be called directly from a test. Instead, each test changes the
// address-bar filters (via queryParamMap) and checks the public pageTitle()
// signal that those private methods end up writing to. That still exercises
// every branch inside them, which is what matters for code path coverage.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { SearchResults } from './search-results';
import { ProductService } from '../../services/product';
import { ProductSearchResult } from '../../models/product-search-result';

describe('SearchResults', () => {
  let component: SearchResults;
  let mockProductService: { browse: ReturnType<typeof vi.fn> };

  // Stands in for ActivatedRoute.queryParamMap. Pushing a new value with
  // .next(...) simulates the shopper clicking a different search or filter link.
  let queryParamMapSubject: Subject<ReturnType<typeof convertToParamMap>>;

  // One sample list of results reused across most tests. "as ProductSearchResult[]"
  // tells TypeScript to trust this shape without checking the exact allowed
  // values for gender/status, since only their string values matter here.
  const sampleResults = [
    {
      id: 1,
      name: 'Classic Tee',
      description: 'A comfortable everyday t-shirt.',
      price: 29.9,
      imageUrl: 'tee.jpg',
      shopName: 'SmartCartel Official',
      categoryName: 'Tops',
      gender: 'MEN',
      defaultVariantId: 10,
      status: 'ACTIVE',
    },
  ] as ProductSearchResult[];

  // Runs before every single test, so each test starts from a clean slate
  // instead of carrying over state from the test before it.
  beforeEach(() => {
    queryParamMapSubject = new Subject();

    mockProductService = {
      browse: vi.fn().mockReturnValue(of(sampleResults)),
    };

    // TestBed builds the component using dependency injection, the same way
    // Angular does when the real app runs, except every dependency here is
    // one of the fakes above instead of the real service.
    TestBed.configureTestingModule({
      providers: [
        SearchResults,
        // provideRouter([]) sets up a real (but route-less) Router, which the
        // [routerLink] on each product card needs in order to render at all.
        // It is listed before the ActivatedRoute override below so that the
        // override wins for the token both of them provide.
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParamMapSubject.asObservable() } },
        { provide: ProductService, useValue: mockProductService },
      ],
    });

    component = TestBed.inject(SearchResults);
  });

  // Small helper so tests can simulate "the address bar now shows these
  // filters" in one line instead of repeating the same line everywhere.
  function emitQuery(query: Record<string, string>): void {
    queryParamMapSubject.next(convertToParamMap(query));
  }

  describe('page heading and filters sent to the server', () => {
    it('shows "All Products" and asks the server for everything when no filters are set', () => {
      component.ngOnInit();
      emitQuery({});

      expect(component.pageTitle()).toBe('All Products');
      expect(mockProductService.browse).toHaveBeenCalledWith({});
    });

    it('shows the search keyword in the heading and sends it as a filter', () => {
      component.ngOnInit();
      emitQuery({ keyword: 'shoes' });

      expect(component.pageTitle()).toBe('Results for "shoes"');
      expect(mockProductService.browse).toHaveBeenCalledWith({ keyword: 'shoes' });
    });

    it('shows a "Women\'s Collection" heading for a WOMEN filter', () => {
      component.ngOnInit();
      emitQuery({ gender: 'WOMEN' });

      expect(component.pageTitle()).toBe("Women's Collection");
      expect(mockProductService.browse).toHaveBeenCalledWith({ gender: 'WOMEN' });
    });

    it('shows a "Men\'s Collection" heading for a MEN filter', () => {
      component.ngOnInit();
      emitQuery({ gender: 'MEN' });

      expect(component.pageTitle()).toBe("Men's Collection");
      expect(mockProductService.browse).toHaveBeenCalledWith({ gender: 'MEN' });
    });

    it('combines gender and category into one heading', () => {
      component.ngOnInit();
      emitQuery({ gender: 'WOMEN', category: 'Tops' });

      expect(component.pageTitle()).toBe("Women's - Tops");
      expect(mockProductService.browse).toHaveBeenCalledWith({ gender: 'WOMEN', category: 'Tops' });
    });

    it('shows the category name alone as the heading', () => {
      component.ngOnInit();
      emitQuery({ category: 'Bottoms' });

      expect(component.pageTitle()).toBe('Bottoms');
      expect(mockProductService.browse).toHaveBeenCalledWith({ category: 'Bottoms' });
    });

    it('leaves an unrecognised gender value unchanged in the heading', () => {
      component.ngOnInit();
      emitQuery({ gender: 'OTHER' });

      expect(component.pageTitle()).toBe('OTHER Collection');
    });

    it('reloads with new filters each time the address changes', () => {
      component.ngOnInit();

      emitQuery({ keyword: 'shoes' });
      expect(mockProductService.browse).toHaveBeenCalledWith({ keyword: 'shoes' });

      emitQuery({ category: 'Bottoms' });
      expect(mockProductService.browse).toHaveBeenCalledWith({ category: 'Bottoms' });
      expect(component.pageTitle()).toBe('Bottoms');
    });
  });

  describe('loading and results state', () => {
    it('stays in a loading state until the server replies', () => {
      // A Subject that has not emitted yet behaves like a call that is
      // still "in flight", so loading() can be checked while still true.
      const pendingBrowse = new Subject<ProductSearchResult[]>();
      mockProductService.browse.mockReturnValue(pendingBrowse.asObservable());

      component.ngOnInit();
      emitQuery({});

      expect(component.loading()).toBe(true);

      pendingBrowse.next(sampleResults);
      expect(component.loading()).toBe(false);
      expect(component.results()).toEqual(sampleResults);
    });

    it('stores the products returned by the server', () => {
      component.ngOnInit();
      emitQuery({});

      expect(component.results()).toEqual(sampleResults);
      expect(component.loading()).toBe(false);
    });

    it('shows an empty list and stops loading if the server call fails', () => {
      mockProductService.browse.mockReturnValue(throwError(() => new Error('network error')));

      component.ngOnInit();
      emitQuery({});

      expect(component.results()).toEqual([]);
      expect(component.loading()).toBe(false);
    });
  });

  // The tests above call component methods directly, which exercises every
  // branch in search-results.ts but never actually draws the HTML template.
  // These tests use TestBed.createComponent(...) instead, which does render
  // search-results.html for real, so the @if / @else if / @else blocks in
  // that file get run too. That's what moves search-results.html's coverage
  // off 0%.
  describe('template rendering', () => {
    function createAndRender() {
      const fixture = TestBed.createComponent(SearchResults);
      fixture.detectChanges(); // runs ngOnInit; loading() starts true, so the skeleton shows first
      return fixture;
    }

    it('shows placeholder boxes while the results are loading', () => {
      // A Subject that has not emitted yet keeps the call "in flight", so the
      // loading skeleton stays on screen for this test to check.
      const pendingBrowse = new Subject<ProductSearchResult[]>();
      mockProductService.browse.mockReturnValue(pendingBrowse.asObservable());

      const fixture = createAndRender();
      emitQuery({});
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).querySelectorAll('.skeleton')).toHaveLength(4);
    });

    it('shows "No products found." when the server returns an empty list', () => {
      mockProductService.browse.mockReturnValue(of([]));

      const fixture = createAndRender();
      emitQuery({});
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).textContent).toContain('No products found.');
    });

    it('shows a card for each product once results arrive', () => {
      const fixture = createAndRender();
      emitQuery({});
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const cards = el.querySelectorAll('.result-card');
      expect(cards).toHaveLength(1);
      expect(cards[0].textContent).toContain('Classic Tee');
      expect(cards[0].textContent).toContain('29.90');
    });
  });
});
