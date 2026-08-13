import { ComponentFixture, TestBed } from '@angular/core/testing';
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
    ...overrides,
  });

  const sampleProducts: AdminProductSummary[] = [
    product({ id: 1, name: 'Blue Tee', shopName: 'ShopA', categoryName: 'Tops', gender: 'MEN', status: 'ACTIVE', createdAt: '2026-01-10T00:00:00Z' }),
    product({ id: 2, name: 'Red Dress', shopName: 'ShopB', categoryName: 'Dresses', gender: 'WOMEN', status: 'INACTIVE', createdAt: '2026-02-15T00:00:00Z' }),
    product({ id: 3, name: 'Green Shoes', shopName: 'ShopA', categoryName: 'Shoes', gender: 'MEN', status: 'ACTIVE', createdAt: '2026-03-20T00:00:00Z' }),
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

    await TestBed.configureTestingModule({
      imports: [AdminProducts],
      providers: [{ provide: AdminProductService, useValue: adminProductService }],
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
});
