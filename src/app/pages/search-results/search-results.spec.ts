// This file tests SearchResults on its own, the same way product-detail.spec.ts
// tests ProductDetail: the real search-results.ts code runs, but ProductService,
// ActivatedRoute, and Router are replaced with stand-ins so no real server call
// or real navigation happens.
//
// buildPageTitle(), formatGender(), handleImageSearchState(), and
// loadImageSearchProducts() are all marked private in the component, so they
// cannot be called directly from a test. Instead, each test changes something
// the component reads on its own (the address-bar filters, or the browser's
// navigation state) and then checks the public signals those private methods
// end up writing to. That still exercises every line and branch inside them,
// which is what "code path coverage" measures.
//
// The file is split into two top-level groups:
//   - "search filters, loading, and rendering" uses a real (route-less) Router
//     via provideRouter([]), because the product cards in the template use
//     [routerLink], which needs a real Router to build its links.
//   - "image search results" uses a fully fake Router instead, because those
//     tests need full control over router.events (to simulate a navigation
//     finishing) and never render the template, so a real Router is not needed.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { ActivatedRoute, Router, NavigationEnd, convertToParamMap, provideRouter } from '@angular/router';

import { SearchResults } from './search-results';
import { ProductService } from '../../services/product';
import { ProductSearchResult } from '../../models/product-search-result';

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

describe('SearchResults - search filters, loading, and rendering', () => {
  let component: SearchResults;
  let mockProductService: { browse: ReturnType<typeof vi.fn> };

  // Stands in for ActivatedRoute.queryParamMap. Pushing a new value with
  // .next(...) simulates the shopper clicking a different search or filter link.
  let queryParamMapSubject: Subject<ReturnType<typeof convertToParamMap>>;

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

    it('shows an empty list, stops loading, and marks the page searched if the server call fails', () => {
      mockProductService.browse.mockReturnValue(throwError(() => new Error('network error')));

      component.ngOnInit();
      emitQuery({});

      expect(component.results()).toEqual([]);
      expect(component.loading()).toBe(false);
      expect(component.searched()).toBe(true);
    });
  });

  // The tests above call ngOnInit and push values into the fake observables
  // directly, which exercises every branch in search-results.ts but never
  // actually draws the HTML template. These tests use TestBed.createComponent(...)
  // instead, which does render search-results.html for real, so the
  // @if / @else if / @else blocks in that file get run too. That is what
  // moves search-results.html's coverage off 0%.
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

describe('SearchResults - image search results from navigation state', () => {
  let component: SearchResults;
  let mockProductService: { browse: ReturnType<typeof vi.fn> };
  let queryParamMapSubject: Subject<ReturnType<typeof convertToParamMap>>;

  // Stands in for Router.events. Pushing a NavigationEnd into it simulates
  // the router finishing a fresh navigation to this page while the component
  // instance stays alive (Angular can reuse the same component instance when
  // navigating to a route it is already showing).
  let routerEventsSubject: Subject<unknown>;

  // A second, distinct set of sample products, so it is easy to tell in an
  // assertion whether the image-search results or the ordinary search
  // results ended up on screen.
  const sampleImageResults = [
    {
      id: 9,
      name: 'Running Sneaker',
      description: 'A lightweight running shoe.',
      price: 79.9,
      imageUrl: 'sneaker.jpg',
      shopName: 'SmartCartel Official',
      categoryName: 'Shoes',
      gender: 'MEN',
      defaultVariantId: 90,
      status: 'ACTIVE',
    },
  ] as ProductSearchResult[];

  beforeEach(() => {
    queryParamMapSubject = new Subject();
    routerEventsSubject = new Subject();

    mockProductService = {
      browse: vi.fn().mockReturnValue(of(sampleResults)),
    };

    // A minimal fake Router. The component only reads router.events and
    // router.url (for a log line), and never calls navigate(), so nothing
    // else needs to be faked here.
    const mockRouter = {
      events: routerEventsSubject.asObservable(),
      url: '/search',
    };

    TestBed.configureTestingModule({
      providers: [
        SearchResults,
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParamMapSubject.asObservable() } },
        { provide: ProductService, useValue: mockProductService },
      ],
    });

    component = TestBed.inject(SearchResults);
  });

  // The browser keeps history.state around between tests unless it is reset,
  // so each test that sets an image-search state cleans up after itself.
  afterEach(() => {
    window.history.replaceState(null, '');
  });

  function emitQuery(query: Record<string, string>): void {
    queryParamMapSubject.next(convertToParamMap(query));
  }

  // Puts the given navigation state onto the browser's real history object,
  // the same way router.navigate(['/search'], { state: {...} }) would when a
  // shopper submits an image search elsewhere in the app.
  function setNavigationState(state: {
    imageSearchResults: ProductSearchResult[];
    imageSearchPrediction?: string;
    imageSearchLabel?: string;
  }): void {
    window.history.pushState(state, '');
  }

  it('enters image-search mode and shows the returned products when the page loads with image search results', () => {
    setNavigationState({
      imageSearchResults: sampleImageResults,
      imageSearchPrediction: 'Sneaker',
      imageSearchLabel: 'Running shoe',
    });

    component.ngOnInit();

    expect(component.imageSearchMode()).toBe(true);
    expect(component.pageTitle()).toBe('Image Search Results');
    expect(component.imageSearchPrediction()).toBe('Sneaker');
    expect(component.imageSearchLabel()).toBe('Running shoe');
    expect(component.results()).toEqual(sampleImageResults);
    expect(component.searched()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it('defaults the prediction and label text to empty strings when the navigation state does not include them', () => {
    setNavigationState({ imageSearchResults: sampleImageResults });

    component.ngOnInit();

    expect(component.imageSearchPrediction()).toBe('');
    expect(component.imageSearchLabel()).toBe('');
  });

  it('shows an empty results list but still marks the page as searched when image search finds no matching products', () => {
    setNavigationState({ imageSearchResults: [] });

    component.ngOnInit();

    expect(component.imageSearchMode()).toBe(true);
    expect(component.results()).toEqual([]);
    expect(component.searched()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it('stays out of image-search mode on an ordinary page load with no navigation state', () => {
    window.history.replaceState(null, '');

    component.ngOnInit();

    expect(component.imageSearchMode()).toBe(false);
    expect(component.imageSearchPrediction()).toBe('');
  });

  it('re-applies the image search state when the router reports that a new navigation has finished', () => {
    // First load: an ordinary page load with no image search state yet.
    component.ngOnInit();
    emitQuery({});
    expect(component.imageSearchMode()).toBe(false);

    // Now simulate: a shopper runs an image search elsewhere, and the app
    // navigates back to this same "/search" page with the results attached
    // as navigation state, while this component instance stays alive.
    setNavigationState({
      imageSearchResults: sampleImageResults,
      imageSearchPrediction: 'Sneaker',
      imageSearchLabel: 'Running shoe',
    });
    routerEventsSubject.next(new NavigationEnd(2, '/search', '/search'));

    expect(component.imageSearchMode()).toBe(true);
    expect(component.pageTitle()).toBe('Image Search Results');
    expect(component.results()).toEqual(sampleImageResults);
  });

  it('ignores router events that are not the end of a navigation', () => {
    setNavigationState({ imageSearchResults: sampleImageResults });
    component.ngOnInit();
    // Undo the initial-load state so it is possible to tell whether the
    // event below re-triggers image search handling or not.
    window.history.replaceState(null, '');
    component.imageSearchMode.set(false);

    // Push something that is not a NavigationEnd. Because it never comes out
    // the other side of the router.events filter, handleImageSearchState()
    // should not run again here.
    routerEventsSubject.next({ id: 3 });

    expect(component.imageSearchMode()).toBe(false);
  });

  it('note: pageTitle reverts to the normal search heading once the query params callback runs afterwards', () => {
    // handleImageSearchState() sets pageTitle to 'Image Search Results' the
    // moment the page loads, but ngOnInit() also subscribes to queryParamMap,
    // and that subscription unconditionally recalculates pageTitle from the
    // current keyword/gender/category filters every time it fires - even when
    // an image search is active. In the real app both run back-to-back, so
    // the "Image Search Results" heading can be overwritten almost
    // immediately. This test documents that current behaviour so it does not
    // come as a surprise; it may be worth checking with the teammate who
    // built the image-search feature whether that is intended.
    setNavigationState({ imageSearchResults: sampleImageResults });

    component.ngOnInit();
    expect(component.pageTitle()).toBe('Image Search Results');

    emitQuery({});
    expect(component.pageTitle()).toBe('All Products');
  });
});
