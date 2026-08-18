import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { of, EMPTY, throwError, Subject, BehaviorSubject } from 'rxjs';

import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

import { SearchResults } from './search-results';

import { ProductService } from '../../services/product';

import { ProductSearchResult } from '../../models/product-search-result';

//Updated by Junior
describe('SearchResults', () => {
  let component: SearchResults;

  let productServiceMock: {
    browse: ReturnType<typeof vi.fn>;
  };

  let queryParamMap$: BehaviorSubject<any>;

  let routerEvents$: Subject<any>;

  let routeMock: {
    queryParamMap: BehaviorSubject<any>;
  };

  let routerMock: {
    events: Subject<any>;
    url: string;
    navigate: ReturnType<typeof vi.fn>;
  };

  // =======================================================
  // HELPER
  // =======================================================

  function createQueryParamMap(
    keyword: string | null = null,
    gender: string | null = null,
    category: string | null = null,
  ) {
    return {
      get: (key: string) => {
        if (key === 'keyword') {
          return keyword;
        }

        if (key === 'gender') {
          return gender;
        }

        if (key === 'category') {
          return category;
        }

        return null;
      },
    };
  }

  function createComponent(): void {
    component = new SearchResults(
      productServiceMock as unknown as ProductService,
      routeMock as unknown as ActivatedRoute,
      routerMock as unknown as Router,
    );
  }

  // =======================================================
  // BEFORE EACH
  // =======================================================

  beforeEach(() => {
    // -----------------------------------------------------
    // Reset browser history state
    // -----------------------------------------------------

    history.replaceState({}, '', '/search');

    // -----------------------------------------------------
    // ProductService mock
    // -----------------------------------------------------

    productServiceMock = {
      browse: vi.fn(),
    };

    // -----------------------------------------------------
    // Query parameters
    // -----------------------------------------------------

    queryParamMap$ = new BehaviorSubject(createQueryParamMap());

    // -----------------------------------------------------
    // Router events
    // -----------------------------------------------------

    routerEvents$ = new Subject<any>();

    // -----------------------------------------------------
    // ActivatedRoute mock
    // -----------------------------------------------------

    routeMock = {
      queryParamMap: queryParamMap$,
    };

    // -----------------------------------------------------
    // Router mock
    // -----------------------------------------------------

    routerMock = {
      events: routerEvents$,

      url: '/search',

      navigate: vi.fn().mockResolvedValue(true),
    };

    // -----------------------------------------------------
    // Create component
    // -----------------------------------------------------

    createComponent();
  });

  // =======================================================
  // AFTER EACH
  // =======================================================

  afterEach(() => {
    vi.restoreAllMocks();

    history.replaceState({}, '', '/search');
  });

  // =======================================================
  // BASIC
  // =======================================================

  describe('initial state', () => {
    it('should be created', () => {
      expect(component).toBeTruthy();
    });

    it('should have empty results', () => {
      expect(component.results()).toEqual([]);
    });

    it('should have loading true initially', () => {
      expect(component.loading()).toBe(true);
    });

    it('should have searched false initially', () => {
      expect(component.searched()).toBe(false);
    });

    it('should have image search mode disabled initially', () => {
      expect(component.imageSearchMode()).toBe(false);
    });

    it('should have empty image search prediction initially', () => {
      expect(component.imageSearchPrediction()).toBe('');
    });

    it('should have empty image search label initially', () => {
      expect(component.imageSearchLabel()).toBe('');
    });

    it('should have All Products as default page title', () => {
      expect(component.pageTitle()).toBe('All Products');
    });
  });

  // =======================================================
  // NG ON INIT
  // =======================================================

  describe('ngOnInit', () => {
    it('should load all products when there are no query parameters', () => {
      const products = [
        {
          id: 1,
          name: 'Green Shirt',
        },
        {
          id: 2,
          name: 'Black Pants',
        },
      ] as ProductSearchResult[];

      productServiceMock.browse.mockReturnValue(of(products));

      component.ngOnInit();

      expect(productServiceMock.browse).toHaveBeenCalled();

      expect(component.results()).toEqual(products);

      expect(component.loading()).toBe(false);

      expect(component.pageTitle()).toBe('All Products');
    });

    it('should search by keyword', () => {
      const products = [
        {
          id: 1,
          name: 'Green Shirt',
        },
      ] as ProductSearchResult[];

      productServiceMock.browse.mockReturnValue(of(products));

      queryParamMap$.next(createQueryParamMap('shirt', null, null));

      component.ngOnInit();

      expect(productServiceMock.browse).toHaveBeenCalledWith({
        keyword: 'shirt',
      });

      expect(component.pageTitle()).toBe('Results for "shirt"');

      expect(component.results()).toEqual(products);
    });

    it('should search by gender', () => {
      const products = [
        {
          id: 1,
          name: 'Women Shirt',
        },
      ] as ProductSearchResult[];

      productServiceMock.browse.mockReturnValue(of(products));

      queryParamMap$.next(createQueryParamMap(null, 'WOMEN', null));

      component.ngOnInit();

      expect(productServiceMock.browse).toHaveBeenCalledWith({
        gender: 'WOMEN',
      });

      expect(component.pageTitle()).toBe("Women's Collection");

      expect(component.results()).toEqual(products);
    });

    it('should search by MEN gender', () => {
      const products = [
        {
          id: 1,
          name: 'Men Shirt',
        },
      ] as ProductSearchResult[];

      productServiceMock.browse.mockReturnValue(of(products));

      queryParamMap$.next(createQueryParamMap(null, 'MEN', null));

      component.ngOnInit();

      expect(productServiceMock.browse).toHaveBeenCalledWith({
        gender: 'MEN',
      });

      expect(component.pageTitle()).toBe("Men's Collection");
    });

    it('should search by category', () => {
      const products = [
        {
          id: 1,
          name: 'Shirt',
        },
      ] as ProductSearchResult[];

      productServiceMock.browse.mockReturnValue(of(products));

      queryParamMap$.next(createQueryParamMap(null, null, 'Shirts'));

      component.ngOnInit();

      expect(productServiceMock.browse).toHaveBeenCalledWith({
        category: 'Shirts',
      });

      expect(component.pageTitle()).toBe('Shirts');
    });

    it('should search by gender and category', () => {
      const products = [
        {
          id: 1,
          name: 'Women Shirt',
        },
      ] as ProductSearchResult[];

      productServiceMock.browse.mockReturnValue(of(products));

      queryParamMap$.next(createQueryParamMap(null, 'WOMEN', 'Shirts'));

      component.ngOnInit();

      expect(productServiceMock.browse).toHaveBeenCalledWith({
        gender: 'WOMEN',
        category: 'Shirts',
      });

      expect(component.pageTitle()).toBe("Women's - Shirts");
    });

    it('should handle product search failure', () => {
      productServiceMock.browse.mockReturnValue(throwError(() => new Error('Server error')));

      component.ngOnInit();

      expect(component.results()).toEqual([]);

      expect(component.loading()).toBe(false);

      expect(component.searched()).toBe(true);
    });
  });

  // =======================================================
  // IMAGE SEARCH
  // =======================================================

  describe('image search', () => {
    it('should load image search results from history state', () => {
      const imageProducts = [
        {
          id: 1,
          name: 'Green Shirt',
        },
      ] as ProductSearchResult[];

      /*
       * IMPORTANT:
       *
       * SearchResults.ngOnInit() calls loadProducts()
       * before checking history.state.imageSearchResults.
       *
       * EMPTY prevents the normal browse() call from
       * overwriting the image-search results.
       */

      productServiceMock.browse.mockReturnValue(EMPTY);

      history.replaceState(
        {
          imageSearchResults: imageProducts,

          imageSearchPrediction: 'man green shirt',

          imageSearchLabel: 'green shirt',

          imageSearchGender: 'man',

          imageSearchColor: 'green',

          imageSearchCategory: 'shirt',
        },
        '',
        '/search',
      );

      component.ngOnInit();

      expect(component.imageSearchMode()).toBe(true);

      expect(component.results()).toEqual(imageProducts);

      expect(component.pageTitle()).toBe('Image Search Results');

      expect(component.imageSearchPrediction()).toBe('man green shirt');

      expect(component.imageSearchLabel()).toBe('green shirt');

      expect(component.loading()).toBe(false);

      expect(component.searched()).toBe(true);
    });

    it('should handle empty image search results', () => {
      productServiceMock.browse.mockReturnValue(EMPTY);

      history.replaceState(
        {
          imageSearchResults: [],

          imageSearchPrediction: 'man green shirt',

          imageSearchLabel: 'green shirt',
        },
        '',
        '/search',
      );

      component.ngOnInit();

      expect(component.imageSearchMode()).toBe(true);

      expect(component.pageTitle()).toBe('Image Search Results');

      expect(component.results()).toEqual([]);

      expect(component.searched()).toBe(true);

      expect(component.loading()).toBe(false);
    });

    it('should use empty values when image search prediction is missing', () => {
      productServiceMock.browse.mockReturnValue(EMPTY);

      const imageProducts = [
        {
          id: 1,
          name: 'Green Shirt',
        },
      ] as ProductSearchResult[];

      history.replaceState(
        {
          imageSearchResults: imageProducts,
        },
        '',
        '/search',
      );

      component.ngOnInit();

      expect(component.imageSearchPrediction()).toBe('');

      expect(component.imageSearchLabel()).toBe('');

      expect(component.results()).toEqual(imageProducts);
    });

    it('should ignore image search state when there are no image results', () => {
      productServiceMock.browse.mockReturnValue(EMPTY);

      history.replaceState({}, '', '/search');

      component.ngOnInit();

      expect(component.imageSearchMode()).toBe(false);

      expect(component.pageTitle()).toBe('All Products');
    });
  });

  // =======================================================
  // ROUTER NAVIGATION
  // =======================================================

  describe('router navigation', () => {
    it('should process image search state when NavigationEnd occurs', () => {
      const imageProducts = [
        {
          id: 10,
          name: 'Blue Pants',
        },
      ] as ProductSearchResult[];

      /*
       * Initial normal search
       */

      productServiceMock.browse.mockReturnValue(of([]));

      history.replaceState({}, '', '/search');

      component.ngOnInit();

      /*
       * Change history state as if image search
       * navigation happened.
       */

      history.replaceState(
        {
          imageSearchResults: imageProducts,

          imageSearchPrediction: 'man blue pants',

          imageSearchLabel: 'blue pants',
        },
        '',
        '/search',
      );

      /*
       * Prevent normal browse() from replacing
       * image results.
       */

      productServiceMock.browse.mockReturnValue(EMPTY);

      routerEvents$.next(new NavigationEnd(1, '/search', '/search'));

      expect(component.imageSearchMode()).toBe(true);

      expect(component.results()).toEqual(imageProducts);

      expect(component.pageTitle()).toBe('Image Search Results');

      expect(component.imageSearchPrediction()).toBe('man blue pants');

      expect(component.imageSearchLabel()).toBe('blue pants');
    });
  });

  // =======================================================
  // PRIVATE METHODS
  // =======================================================

  describe('buildPageTitle', () => {
    it('should return keyword title', () => {
      const result = (component as any).buildPageTitle('shoes', null, null);

      expect(result).toBe('Results for "shoes"');
    });

    it('should return gender and category title', () => {
      const result = (component as any).buildPageTitle(null, 'WOMEN', 'Shoes');

      expect(result).toBe("Women's - Shoes");
    });

    it('should return gender collection title for WOMEN', () => {
      const result = (component as any).buildPageTitle(null, 'WOMEN', null);

      expect(result).toBe("Women's Collection");
    });

    it('should return gender collection title for MEN', () => {
      const result = (component as any).buildPageTitle(null, 'MEN', null);

      expect(result).toBe("Men's Collection");
    });

    it('should return category title', () => {
      const result = (component as any).buildPageTitle(null, null, 'Shoes');

      expect(result).toBe('Shoes');
    });

    it('should return All Products when there are no filters', () => {
      const result = (component as any).buildPageTitle(null, null, null);

      expect(result).toBe('All Products');
    });
  });

  // =======================================================
  // FORMAT GENDER
  // =======================================================

  describe('formatGender', () => {
    it('should format WOMEN', () => {
      const result = (component as any).formatGender('WOMEN');

      expect(result).toBe("Women's");
    });

    it('should format lowercase women', () => {
      const result = (component as any).formatGender('women');

      expect(result).toBe("Women's");
    });

    it('should format MEN', () => {
      const result = (component as any).formatGender('MEN');

      expect(result).toBe("Men's");
    });

    it('should format lowercase men', () => {
      const result = (component as any).formatGender('men');

      expect(result).toBe("Men's");
    });

    it('should return unknown gender unchanged', () => {
      const result = (component as any).formatGender('UNISEX');

      expect(result).toBe('UNISEX');
    });
  });

  // =======================================================
  // IMAGE RESULTS DIRECTLY
  // =======================================================

  describe('loadImageSearchProducts', () => {
    it('should display image search products', () => {
      const products = [
        {
          id: 1,
          name: 'Green Shirt',
        },
        {
          id: 2,
          name: 'Green Pants',
        },
      ] as ProductSearchResult[];

      (component as any).loadImageSearchProducts(products);

      expect(component.results()).toEqual(products);

      expect(component.searched()).toBe(true);

      expect(component.loading()).toBe(false);
    });

    it('should handle null image search results', () => {
      (component as any).loadImageSearchProducts(null);

      expect(component.results()).toEqual([]);

      expect(component.searched()).toBe(true);

      expect(component.loading()).toBe(false);
    });

    it('should handle empty image search results', () => {
      (component as any).loadImageSearchProducts([]);

      expect(component.results()).toEqual([]);

      expect(component.searched()).toBe(true);

      expect(component.loading()).toBe(false);
    });
  });
});
