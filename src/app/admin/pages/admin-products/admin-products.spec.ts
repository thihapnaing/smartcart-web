import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AdminProducts } from './admin-products';
import { AdminProductService } from '../../services/admin-product';
import { AdminProductSummary } from '../../models/admin-product-summary';

describe('AdminProducts', () => {
  let fixture: ComponentFixture<AdminProducts>;
  let component: AdminProducts;
  let adminProductService: {
    getAllProducts: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let activatedRoute: { snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> } };

  const product = (overrides: Partial<AdminProductSummary>): AdminProductSummary => ({
    id: 1,
    name: 'Blue Tee',
    price: 15,
    imageUrl: 'tee.jpg',
    categoryName: 'Tops',
    shopName: 'ShopA',
    gender: 'MEN',
    status: 'ACTIVE',
    createdAt: '2026-01-10T00:00:00Z',
    merchantId: 10,
    ...overrides,
  });

  const sampleProducts: AdminProductSummary[] = [
    product({ id: 1, name: 'Blue Tee', shopName: 'ShopA', merchantId: 10, categoryName: 'Tops', gender: 'MEN', status: 'ACTIVE', createdAt: '2026-01-10T00:00:00Z' }),
    product({ id: 2, name: 'Red Dress', shopName: 'ShopB', merchantId: 20, categoryName: 'Dresses', gender: 'WOMEN', status: 'INACTIVE', createdAt: '2026-02-15T00:00:00Z' }),
    product({ id: 3, name: 'Green Shoes', shopName: 'ShopA', merchantId: 10, categoryName: 'Shoes', gender: 'MEN', status: 'ACTIVE', createdAt: '2026-03-20T00:00:00Z' }),
  ];

  const setup = () => {
    fixture = TestBed.createComponent(AdminProducts);
    component = fixture.componentInstance;
  };

  beforeEach(async () => {
    adminProductService = {
      getAllProducts: vi.fn().mockReturnValue(of(sampleProducts)),
      updateStatus: vi.fn(),
    };
    router = { navigate: vi.fn() };
    activatedRoute = { snapshot: { queryParamMap: convertToParamMap({}) } };

    await TestBed.configureTestingModule({
      imports: [AdminProducts],
      providers: [
        { provide: AdminProductService, useValue: adminProductService },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    setup();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit / loadProducts', () => {
    it('loads products and stops loading on success', () => {
      setup();
      fixture.detectChanges();

      expect(component.products()).toEqual(sampleProducts);
      expect(component.loading()).toBe(false);
    });

    it('stops loading (without setting products) when the request fails', () => {
      adminProductService.getAllProducts.mockReturnValue(throwError(() => new Error('boom')));
      setup();
      fixture.detectChanges();

      expect(component.products()).toEqual([]);
      expect(component.loading()).toBe(false);
    });
  });

  describe('categories', () => {
    it('returns "All" plus the unique category names in alphabetical order', () => {
      setup();
      fixture.detectChanges();

      expect(component.categories()).toEqual(['All', 'Dresses', 'Shoes', 'Tops']);
    });
  });

  describe('filteredProducts', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    it('matches by product name (case-insensitive)', () => {
      component.searchTerm.set('blue');

      expect(component.filteredProducts().map((p) => p.id)).toEqual([1]);
    });

    it('matches by shop name (case-insensitive)', () => {
      component.searchTerm.set('shopb');

      expect(component.filteredProducts().map((p) => p.id)).toEqual([2]);
    });

    it('filters by category', () => {
      component.selectedCategory.set('Shoes');

      expect(component.filteredProducts().map((p) => p.id)).toEqual([3]);
    });

    it('filters by gender', () => {
      component.selectedGender.set('WOMEN');

      expect(component.filteredProducts().map((p) => p.id)).toEqual([2]);
    });

    it('filters by status', () => {
      component.selectedStatus.set('INACTIVE');

      expect(component.filteredProducts().map((p) => p.id)).toEqual([2]);
    });

    it('filters by a from-date, including that whole day', () => {
      component.dateFrom.set('2026-02-15');

      expect(component.filteredProducts().map((p) => p.id)).toEqual([2, 3]);
    });

    it('filters by a to-date, including the entire end day', () => {
      component.dateTo.set('2026-02-15');

      expect(component.filteredProducts().map((p) => p.id)).toEqual([1, 2]);
    });

    it('combines multiple filters with AND semantics', () => {
      component.selectedGender.set('MEN');
      component.selectedStatus.set('ACTIVE');
      component.searchTerm.set('shoes');

      expect(component.filteredProducts().map((p) => p.id)).toEqual([3]);
    });
  });

  describe('pagination', () => {
    beforeEach(() => {
      setup();
    });

    it('totalPages is at least 1 even when there are no matches', () => {
      fixture.detectChanges();
      component.searchTerm.set('nonexistent product');

      expect(component.totalPages()).toBe(1);
      expect(component.pagedProducts()).toEqual([]);
    });

    it('paginates using pageSize', () => {
      // pageSize is a plain field, not a signal - totalPages/pagedProducts only recompute when
      // one of their *signal* dependencies changes, so pageSize must be set before the first
      // detectChanges() (which is what first reads/caches these computeds via the template).
      component.pageSize = 2;
      fixture.detectChanges();
      component.currentPage.set(1);

      expect(component.totalPages()).toBe(2);
      expect(component.pageNumbers()).toEqual([1, 2]);
      expect(component.pagedProducts().map((p) => p.id)).toEqual([1, 2]);

      component.currentPage.set(2);
      expect(component.pagedProducts().map((p) => p.id)).toEqual([3]);
    });

    it('goToPage ignores out-of-range pages', () => {
      fixture.detectChanges();
      component.goToPage(0);
      expect(component.currentPage()).toBe(1);

      component.goToPage(99);
      expect(component.currentPage()).toBe(1);

      component.goToPage(1);
      expect(component.currentPage()).toBe(1);
    });
  });

  describe('filter setters reset the page', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
      component.currentPage.set(3);
    });

    it('onSearchChange sets the term and resets to page 1', () => {
      component.onSearchChange('tee');
      expect(component.searchTerm()).toBe('tee');
      expect(component.currentPage()).toBe(1);
    });

    it('onCategoryChange sets the category and resets to page 1', () => {
      component.onCategoryChange('Shoes');
      expect(component.selectedCategory()).toBe('Shoes');
      expect(component.currentPage()).toBe(1);
    });

    it('onGenderChange sets the gender and resets to page 1', () => {
      component.onGenderChange('WOMEN');
      expect(component.selectedGender()).toBe('WOMEN');
      expect(component.currentPage()).toBe(1);
    });

    it('onStatusChange sets the status and resets to page 1', () => {
      component.onStatusChange('INACTIVE');
      expect(component.selectedStatus()).toBe('INACTIVE');
      expect(component.currentPage()).toBe(1);
    });

    it('onDateFromChange sets the from-date and resets to page 1', () => {
      component.onDateFromChange('2026-01-01');
      expect(component.dateFrom()).toBe('2026-01-01');
      expect(component.currentPage()).toBe(1);
    });

    it('onDateToChange sets the to-date and resets to page 1', () => {
      component.onDateToChange('2026-12-31');
      expect(component.dateTo()).toBe('2026-12-31');
      expect(component.currentPage()).toBe(1);
    });

    it('clearFilters resets every filter and the page', () => {
      component.searchTerm.set('tee');
      component.selectedCategory.set('Shoes');
      component.selectedGender.set('WOMEN');
      component.selectedStatus.set('INACTIVE');
      component.dateFrom.set('2026-01-01');
      component.dateTo.set('2026-12-31');

      component.clearFilters();

      expect(component.searchTerm()).toBe('');
      expect(component.selectedCategory()).toBe('All');
      expect(component.selectedGender()).toBe('All');
      expect(component.selectedStatus()).toBe('All');
      expect(component.dateFrom()).toBe('');
      expect(component.dateTo()).toBe('');
      expect(component.currentPage()).toBe(1);
    });
  });

  describe('toggleStatus', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    it('marks the product as updating, then applies the returned product on success', () => {
      const updated = product({ id: 1, status: 'INACTIVE' });
      adminProductService.updateStatus.mockReturnValue(of(updated));

      component.toggleStatus(sampleProducts[0]);

      expect(adminProductService.updateStatus).toHaveBeenCalledWith(1, 'INACTIVE');
      expect(component.updatingId()).toBeNull();
      expect(component.products().find((p) => p.id === 1)?.status).toBe('INACTIVE');
    });

    it('toggles an INACTIVE product to ACTIVE', () => {
      const inactiveProduct = sampleProducts[1];
      adminProductService.updateStatus.mockReturnValue(of(product({ id: 2, status: 'ACTIVE' })));

      component.toggleStatus(inactiveProduct);

      expect(adminProductService.updateStatus).toHaveBeenCalledWith(2, 'ACTIVE');
    });

    it('clears updatingId on error without changing the product', () => {
      adminProductService.updateStatus.mockReturnValue(throwError(() => new Error('boom')));

      component.toggleStatus(sampleProducts[0]);

      expect(component.updatingId()).toBeNull();
      expect(component.products().find((p) => p.id === 1)?.status).toBe('ACTIVE');
    });
  });

  describe('selection', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    it('toggleSelect adds then removes an id', () => {
      component.toggleSelect(1);
      expect(component.selectedIds().has(1)).toBe(true);
      expect(component.selectedCount()).toBe(1);

      component.toggleSelect(1);
      expect(component.selectedIds().has(1)).toBe(false);
      expect(component.selectedCount()).toBe(0);
    });

    it('toggleSelectAllOnPage selects all when none are selected, then clears them', () => {
      expect(component.allOnPageSelected()).toBe(false);

      component.toggleSelectAllOnPage();
      expect(component.selectedCount()).toBe(3);
      expect(component.allOnPageSelected()).toBe(true);

      component.toggleSelectAllOnPage();
      expect(component.selectedCount()).toBe(0);
    });

    it('clearSelection empties the selection', () => {
      component.toggleSelect(1);
      component.toggleSelect(2);

      component.clearSelection();

      expect(component.selectedCount()).toBe(0);
    });

    it('selectedHasActive is true only when at least one selected product is ACTIVE', () => {
      component.toggleSelect(2); // INACTIVE
      expect(component.selectedHasActive()).toBe(false);

      component.toggleSelect(1); // ACTIVE
      expect(component.selectedHasActive()).toBe(true);
    });
  });

  describe('bulk actions', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    it('bulkDeactivate does nothing when no ACTIVE products are selected', () => {
      component.toggleSelect(2); // already INACTIVE

      component.bulkDeactivate();

      expect(adminProductService.updateStatus).not.toHaveBeenCalled();
      expect(component.bulkUpdating()).toBe(false);
    });

    it('bulkDeactivate updates only the ACTIVE selected products and clears the selection', () => {
      component.toggleSelect(1); // ACTIVE
      component.toggleSelect(2); // INACTIVE, should be ignored
      component.toggleSelect(3); // ACTIVE
      adminProductService.updateStatus.mockImplementation((id: number) =>
        of(product({ id, status: 'INACTIVE' }))
      );

      component.bulkDeactivate();

      expect(adminProductService.updateStatus).toHaveBeenCalledWith(1, 'INACTIVE');
      expect(adminProductService.updateStatus).toHaveBeenCalledWith(3, 'INACTIVE');
      expect(adminProductService.updateStatus).not.toHaveBeenCalledWith(2, expect.anything());
      expect(component.selectedCount()).toBe(0);
      expect(component.bulkUpdating()).toBe(false);
      expect(component.products().find((p) => p.id === 1)?.status).toBe('INACTIVE');
      expect(component.products().find((p) => p.id === 3)?.status).toBe('INACTIVE');
    });

    it('bulkActivate updates only the INACTIVE selected products', () => {
      component.toggleSelect(2); // INACTIVE
      adminProductService.updateStatus.mockReturnValue(of(product({ id: 2, status: 'ACTIVE' })));

      component.bulkActivate();

      expect(adminProductService.updateStatus).toHaveBeenCalledWith(2, 'ACTIVE');
    });

    it('clears bulkUpdating on error', () => {
      component.toggleSelect(1);
      adminProductService.updateStatus.mockReturnValue(throwError(() => new Error('boom')));

      component.bulkDeactivate();

      expect(component.bulkUpdating()).toBe(false);
    });
  });

  describe('merchant filter (arriving from a merchant\'s detail modal)', () => {
    it('defaults to no merchant filter when the query params are absent', () => {
      setup();
      fixture.detectChanges();

      expect(component.merchantIdFilter()).toBeNull();
      expect(component.merchantNameFilter()).toBeNull();
      expect(component.filteredProducts().map((p) => p.id)).toEqual([1, 2, 3]);
    });

    it('reads merchantId/merchantName from the query params on init and filters to that merchant', () => {
      activatedRoute.snapshot.queryParamMap = convertToParamMap({ merchantId: '10', merchantName: 'ShopA' });

      setup();
      fixture.detectChanges();

      expect(component.merchantIdFilter()).toBe(10);
      expect(component.merchantNameFilter()).toBe('ShopA');
      expect(component.filteredProducts().map((p) => p.id)).toEqual([1, 3]);
    });

    it('combines the merchant filter with the other filters using AND semantics', () => {
      activatedRoute.snapshot.queryParamMap = convertToParamMap({ merchantId: '10' });

      setup();
      fixture.detectChanges();
      component.selectedCategory.set('Shoes');

      expect(component.filteredProducts().map((p) => p.id)).toEqual([3]);
    });

    it('clearMerchantFilter resets the filter, resets the page, and strips the query params from the URL', () => {
      activatedRoute.snapshot.queryParamMap = convertToParamMap({ merchantId: '10', merchantName: 'ShopA' });
      setup();
      fixture.detectChanges();
      component.currentPage.set(2);

      component.clearMerchantFilter();

      expect(component.merchantIdFilter()).toBeNull();
      expect(component.merchantNameFilter()).toBeNull();
      expect(component.currentPage()).toBe(1);
      expect(router.navigate).toHaveBeenCalledWith([], { relativeTo: activatedRoute, queryParams: {} });
    });
  });

  // These drive the actual rendered template (clicks, change events, ngModel) instead of
  // calling component methods directly, so the click/change listeners Angular generates from
  // admin-products.html - and the @if/@for branches they gate - are the ones under test here,
  // not just the plain TS methods behind them.
  describe('DOM interactions', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    const rows = () => fixture.nativeElement.querySelectorAll('.table-row:not(.table-row--head)') as NodeListOf<HTMLElement>;

    it('typing in the search box filters the table via the real ngModel binding', () => {
      const input = fixture.nativeElement.querySelector('#product-search') as HTMLInputElement;
      input.value = 'blue';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.searchTerm()).toBe('blue');
      expect(rows().length).toBe(1);
      expect(rows()[0].textContent).toContain('Blue Tee');
    });

    it('changing the category/gender/status selects filters the table via the real ngModel binding', () => {
      const categorySelect = fixture.nativeElement.querySelector('#product-category') as HTMLSelectElement;
      categorySelect.value = 'Shoes';
      categorySelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(component.selectedCategory()).toBe('Shoes');
      expect(rows().length).toBe(1);

      component.clearFilters();
      fixture.detectChanges();

      const genderSelect = fixture.nativeElement.querySelector('#product-gender') as HTMLSelectElement;
      genderSelect.value = 'WOMEN';
      genderSelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(component.selectedGender()).toBe('WOMEN');
      expect(rows().length).toBe(1);

      component.clearFilters();
      fixture.detectChanges();

      const statusSelect = fixture.nativeElement.querySelector('#product-status') as HTMLSelectElement;
      statusSelect.value = 'INACTIVE';
      statusSelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(component.selectedStatus()).toBe('INACTIVE');
      expect(rows().length).toBe(1);
    });

    it('changing the date range inputs filters the table via the real ngModel binding', () => {
      const from = fixture.nativeElement.querySelector('#listed-from') as HTMLInputElement;
      from.value = '2026-02-15';
      from.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.dateFrom()).toBe('2026-02-15');
      expect(rows().length).toBe(2);

      const to = fixture.nativeElement.querySelector('#listed-to') as HTMLInputElement;
      to.value = '2026-02-15';
      to.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.dateTo()).toBe('2026-02-15');
      expect(rows().length).toBe(1);
    });

    it('clicking Clear resets every filter', () => {
      component.searchTerm.set('tee');
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('.clear-filters-btn') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(component.searchTerm()).toBe('');
      expect(rows().length).toBe(3);
    });

    it('clicking the merchant filter banner Clear button removes the filter', () => {
      component.merchantIdFilter.set(10);
      component.merchantNameFilter.set('ShopA');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.merchant-filter-banner')).toBeTruthy();

      (fixture.nativeElement.querySelector('.merchant-filter-banner .link-btn') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(component.merchantIdFilter()).toBeNull();
      expect(fixture.nativeElement.querySelector('.merchant-filter-banner')).toBeNull();
    });

    it('clicking a row toggle button (de)activates that product', () => {
      adminProductService.updateStatus.mockReturnValue(of(product({ id: 1, status: 'INACTIVE' })));

      const toggleBtn = rows()[0].querySelector('.toggle-btn') as HTMLButtonElement;
      expect(toggleBtn.textContent).toContain('Deactivate');
      toggleBtn.click();
      fixture.detectChanges();

      expect(adminProductService.updateStatus).toHaveBeenCalledWith(1, 'INACTIVE');
    });

    it('selecting rows via checkboxes shows the bulk bar and clicking a row checkbox toggles selection', () => {
      expect(fixture.nativeElement.querySelector('.bulk-bar')).toBeNull();

      const firstCheckbox = rows()[0].querySelector('input[type="checkbox"]') as HTMLInputElement;
      firstCheckbox.click();
      fixture.detectChanges();

      expect(component.selectedIds().has(1)).toBe(true);
      const bulkBar = fixture.nativeElement.querySelector('.bulk-bar');
      expect(bulkBar).toBeTruthy();
      expect(bulkBar.textContent).toContain('1 selected');

      firstCheckbox.click();
      fixture.detectChanges();
      expect(component.selectedIds().has(1)).toBe(false);
      expect(fixture.nativeElement.querySelector('.bulk-bar')).toBeNull();
    });

    it('the select-all checkbox selects and clears every row on the page', () => {
      const selectAll = fixture.nativeElement.querySelector('#select-all-products') as HTMLInputElement;
      expect(selectAll.checked).toBe(false);

      selectAll.click();
      fixture.detectChanges();

      expect(component.selectedCount()).toBe(3);
      expect(selectAll.checked).toBe(true);

      selectAll.click();
      fixture.detectChanges();

      expect(component.selectedCount()).toBe(0);
    });

    it('clicking Clear in the bulk bar clears the selection', () => {
      component.toggleSelect(1);
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('.bulk-bar .link-btn') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(component.selectedCount()).toBe(0);
      expect(fixture.nativeElement.querySelector('.bulk-bar')).toBeNull();
    });

    it('the bulk bar shows Deactivate when the selection has an ACTIVE product, and clicking it bulk-deactivates', () => {
      adminProductService.updateStatus.mockImplementation((id: number) => of(product({ id, status: 'INACTIVE' })));
      component.toggleSelect(1); // ACTIVE

      fixture.detectChanges();
      const bulkBtn = fixture.nativeElement.querySelector('.bulk-deactivate-btn') as HTMLButtonElement;
      expect(bulkBtn).toBeTruthy();

      bulkBtn.click();
      fixture.detectChanges();

      expect(adminProductService.updateStatus).toHaveBeenCalledWith(1, 'INACTIVE');
      expect(component.selectedCount()).toBe(0);
    });

    it('the bulk bar shows Activate when the whole selection is INACTIVE, and clicking it bulk-activates', () => {
      adminProductService.updateStatus.mockReturnValue(of(product({ id: 2, status: 'ACTIVE' })));
      component.toggleSelect(2); // INACTIVE

      fixture.detectChanges();
      const bulkBtn = fixture.nativeElement.querySelector('.bulk-activate-btn') as HTMLButtonElement;
      expect(bulkBtn).toBeTruthy();

      bulkBtn.click();
      fixture.detectChanges();

      expect(adminProductService.updateStatus).toHaveBeenCalledWith(2, 'ACTIVE');
    });
  });

  describe('DOM interactions - pagination', () => {
    beforeEach(() => {
      // pageSize is a plain field, not a signal - see the note in the non-DOM pagination
      // describe above: it must be set before the first detectChanges().
      setup();
      component.pageSize = 2;
      fixture.detectChanges();
    });

    it('clicking pagination buttons navigates between pages', () => {
      const pageBtns = () => Array.from(fixture.nativeElement.querySelectorAll('.pagination .page-btn')) as HTMLButtonElement[];
      // Prev, 1, 2, Next
      expect(pageBtns()).toHaveLength(4);

      pageBtns()[2].click(); // page "2"
      fixture.detectChanges();
      expect(component.currentPage()).toBe(2);

      pageBtns()[0].click(); // Prev
      fixture.detectChanges();
      expect(component.currentPage()).toBe(1);

      pageBtns()[3].click(); // Next
      fixture.detectChanges();
      expect(component.currentPage()).toBe(2);
    });
  });
});
