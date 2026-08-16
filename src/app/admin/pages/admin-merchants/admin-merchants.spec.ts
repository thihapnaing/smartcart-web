import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';
import { AdminMerchants } from './admin-merchants';
import { AdminMerchantService } from '../../services/admin-merchant';
import { AdminMerchantDetail, AdminMerchantSummary } from '../../models/admin-merchant-summary';

describe('AdminMerchants', () => {
  let fixture: ComponentFixture<AdminMerchants>;
  let component: AdminMerchants;
  let adminMerchantService: {
    getAllMerchants: ReturnType<typeof vi.fn>;
    getMerchantDetail: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const merchant = (overrides: Partial<AdminMerchantSummary>): AdminMerchantSummary => ({
    id: 1,
    username: 'shopA',
    email: 'shopa@example.com',
    status: 'ACTIVE',
    createdAt: '2026-01-10T00:00:00Z',
    listingCount: 3,
    lastModifiedByAdminUsername: null,
    lastModifiedAt: null,
    ...overrides,
  });

  const merchantDetail = (overrides: Partial<AdminMerchantDetail>): AdminMerchantDetail => ({
    ...merchant({}),
    orderCount: 12,
    revenue: 250.5,
    ...overrides,
  });

  const sampleMerchants: AdminMerchantSummary[] = [
    merchant({ id: 1, username: 'shopA', email: 'shopa@example.com', status: 'ACTIVE' }),
    merchant({ id: 2, username: 'shopB', email: 'shopb@example.com', status: 'INACTIVE' }),
    merchant({ id: 3, username: 'shopC', email: 'shopc@example.com', status: 'SUSPENDED' }),
  ];

  const setup = () => {
    fixture = TestBed.createComponent(AdminMerchants);
    component = fixture.componentInstance;
  };

  beforeEach(async () => {
    adminMerchantService = {
      getAllMerchants: vi.fn().mockReturnValue(of(sampleMerchants)),
      getMerchantDetail: vi.fn().mockReturnValue(of(merchantDetail({ id: 1 }))),
      updateStatus: vi.fn(),
    };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AdminMerchants],
      providers: [
        { provide: AdminMerchantService, useValue: adminMerchantService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    setup();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit / loadMerchants', () => {
    it('loads merchants and stops loading on success', () => {
      setup();
      fixture.detectChanges();

      expect(component.merchants()).toEqual(sampleMerchants);
      expect(component.loading()).toBe(false);
    });

    it('stops loading (without setting merchants) when the request fails', () => {
      adminMerchantService.getAllMerchants.mockReturnValue(throwError(() => new Error('boom')));
      setup();
      fixture.detectChanges();

      expect(component.merchants()).toEqual([]);
      expect(component.loading()).toBe(false);
    });
  });

  describe('filteredMerchants', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    it('matches by username (case-insensitive)', () => {
      component.searchTerm.set('shopa');

      expect(component.filteredMerchants().map((m) => m.id)).toEqual([1]);
    });

    it('matches by email (case-insensitive)', () => {
      component.searchTerm.set('SHOPB@EXAMPLE.COM');

      expect(component.filteredMerchants().map((m) => m.id)).toEqual([2]);
    });

    it('filters by status', () => {
      component.selectedStatus.set('SUSPENDED');

      expect(component.filteredMerchants().map((m) => m.id)).toEqual([3]);
    });

    it('combines search and status with AND semantics', () => {
      component.selectedStatus.set('ACTIVE');
      component.searchTerm.set('shopa');

      expect(component.filteredMerchants().map((m) => m.id)).toEqual([1]);

      component.searchTerm.set('shopb');
      expect(component.filteredMerchants()).toEqual([]);
    });
  });

  describe('onSearchChange / onStatusFilterChange', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
      component.currentPage.set(3);
    });

    it('onSearchChange sets the term and resets to page 1', () => {
      component.onSearchChange('shop');
      expect(component.searchTerm()).toBe('shop');
      expect(component.currentPage()).toBe(1);
    });

    it('onStatusFilterChange sets the status and resets to page 1', () => {
      component.onStatusFilterChange('SUSPENDED');
      expect(component.selectedStatus()).toBe('SUSPENDED');
      expect(component.currentPage()).toBe(1);
    });
  });

  describe('pagination', () => {
    beforeEach(() => {
      setup();
    });

    it('totalPages is at least 1 even when there are no matches', () => {
      fixture.detectChanges();
      component.searchTerm.set('nonexistent merchant');

      expect(component.totalPages()).toBe(1);
      expect(component.pagedMerchants()).toEqual([]);
    });

    it('paginates using pageSize', () => {
      // pageSize is a plain field, not a signal - totalPages/pagedMerchants only recompute
      // when one of their *signal* dependencies changes, so pageSize must be set before the
      // first detectChanges() (which is what first reads/caches these computeds via the template).
      component.pageSize = 2;
      fixture.detectChanges();
      component.currentPage.set(1);

      expect(component.totalPages()).toBe(2);
      expect(component.pageNumbers()).toEqual([1, 2]);
      expect(component.pagedMerchants().map((m) => m.id)).toEqual([1, 2]);

      component.currentPage.set(2);
      expect(component.pagedMerchants().map((m) => m.id)).toEqual([3]);
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

  describe('nextActions', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    it('offers Suspend for ACTIVE', () => {
      expect(component.nextActions('ACTIVE')).toEqual([
        { label: 'Suspend', status: 'SUSPENDED', tone: 'negative' },
      ]);
    });

    it('offers Reactivate for SUSPENDED', () => {
      expect(component.nextActions('SUSPENDED')).toEqual([
        { label: 'Reactivate', status: 'ACTIVE', tone: 'positive' },
      ]);
    });

    it('offers Activate for INACTIVE', () => {
      expect(component.nextActions('INACTIVE')).toEqual([
        { label: 'Activate', status: 'ACTIVE', tone: 'positive' },
      ]);
    });
  });

  describe('setStatus', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    it('marks the merchant as updating, then applies the returned merchant on success', () => {
      const updated = merchant({ id: 2, status: 'ACTIVE' });
      adminMerchantService.updateStatus.mockReturnValue(of(updated));

      component.setStatus(sampleMerchants[1], 'ACTIVE');

      expect(adminMerchantService.updateStatus).toHaveBeenCalledWith(2, 'ACTIVE');
      expect(component.updatingId()).toBeNull();
      expect(component.merchants().find((m) => m.id === 2)?.status).toBe('ACTIVE');
    });

    it('clears updatingId on error without changing the merchant', () => {
      adminMerchantService.updateStatus.mockReturnValue(throwError(() => new Error('boom')));

      component.setStatus(sampleMerchants[1], 'ACTIVE');

      expect(component.updatingId()).toBeNull();
      expect(component.merchants().find((m) => m.id === 2)?.status).toBe('INACTIVE');
    });

    it('syncs selectedMerchant and merchantDetail when the updated merchant is open in the modal', () => {
      adminMerchantService.getMerchantDetail.mockReturnValue(of(merchantDetail({ id: 2, status: 'INACTIVE' })));
      component.openDetail(sampleMerchants[1]);

      const updated = merchant({ id: 2, status: 'ACTIVE' });
      adminMerchantService.updateStatus.mockReturnValue(of(updated));

      component.setStatus(sampleMerchants[1], 'ACTIVE');

      expect(component.selectedMerchant()).toEqual(updated);
      expect(component.merchantDetail()?.status).toBe('ACTIVE');
      // orders/revenue already fetched shouldn't be wiped out by a status-only update
      expect(component.merchantDetail()?.orderCount).toBe(12);
    });

    it('does not touch selectedMerchant when a different merchant is updated', () => {
      component.openDetail(sampleMerchants[0]);
      adminMerchantService.updateStatus.mockReturnValue(of(merchant({ id: 2, status: 'ACTIVE' })));

      component.setStatus(sampleMerchants[1], 'ACTIVE');

      expect(component.selectedMerchant()).toEqual(sampleMerchants[0]);
    });
  });

  describe('openDetail / closeDetail', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    it('openDetail sets the selected merchant immediately and fetches order/revenue detail', () => {
      component.openDetail(sampleMerchants[0]);

      expect(component.selectedMerchant()).toEqual(sampleMerchants[0]);
      expect(adminMerchantService.getMerchantDetail).toHaveBeenCalledWith(1);
      expect(component.detailLoading()).toBe(false);
      expect(component.merchantDetail()?.orderCount).toBe(12);
      expect(component.merchantDetail()?.revenue).toBe(250.5);
    });

    it('clears detailLoading without setting merchantDetail when the detail request fails', () => {
      adminMerchantService.getMerchantDetail.mockReturnValue(throwError(() => new Error('boom')));

      component.openDetail(sampleMerchants[0]);

      expect(component.detailLoading()).toBe(false);
      expect(component.merchantDetail()).toBeNull();
    });

    it('closeDetail clears both the selected merchant and its detail', () => {
      component.openDetail(sampleMerchants[0]);
      component.closeDetail();

      expect(component.selectedMerchant()).toBeNull();
      expect(component.merchantDetail()).toBeNull();
    });
  });

  describe('viewListings', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    it('navigates to the products page filtered to this merchant', () => {
      component.viewListings(sampleMerchants[0]);

      expect(router.navigate).toHaveBeenCalledWith(['/admin/products'], {
        queryParams: { merchantId: 1, merchantName: 'shopA' },
      });
    });
  });

  // These drive the actual rendered template (clicks, keyboard events, ngModel) instead of
  // calling component methods directly, so the click/keydown/ngModelChange listeners Angular
  // generates from admin-merchants.html - and the @if/@for branches they gate - are the ones
  // under test here, not just the plain TS methods behind them.
  describe('DOM interactions', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    const openFirstRow = () => {
      const openBtn = fixture.nativeElement.querySelectorAll('.row-open-btn')[0] as HTMLButtonElement;
      openBtn.click();
      fixture.detectChanges();
    };

    it('shows who last changed the status in the row\'s own column and under the badge in the modal', () => {
      adminMerchantService.getAllMerchants.mockReturnValue(of([
        merchant({ id: 1, username: 'shopA', status: 'SUSPENDED', lastModifiedByAdminUsername: 'grace_admin' }),
        merchant({ id: 2, username: 'shopB', status: 'ACTIVE', lastModifiedByAdminUsername: null }),
      ]));
      adminMerchantService.getMerchantDetail.mockReturnValue(
        of(merchantDetail({ id: 1, status: 'SUSPENDED', lastModifiedByAdminUsername: 'grace_admin' })),
      );
      setup();
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('.table-row:not(.table-row--head)') as NodeListOf<HTMLElement>;
      expect(rows[0].querySelector('.col-modified')?.textContent).toContain('grace_admin');
      expect(rows[1].querySelector('.col-modified')?.textContent).toContain('—');

      openFirstRow();
      const panel = fixture.nativeElement.querySelector('.modal-panel') as HTMLElement;
      expect(panel.querySelector('.last-modified-by')?.textContent).toContain('grace_admin');
    });

    it('clicking a row opens the detail modal with the merchant summary and fetched detail', () => {
      expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeNull();

      openFirstRow();

      expect(adminMerchantService.getMerchantDetail).toHaveBeenCalledWith(1);
      const panel = fixture.nativeElement.querySelector('.modal-panel') as HTMLElement;
      expect(panel).toBeTruthy();
      expect(panel.querySelector('.modal-username')?.textContent).toContain('shopA');
      expect(panel.querySelector('.modal-email')?.textContent).toContain('shopa@example.com');
      expect(panel.textContent).toContain('12'); // orderCount
    });

    it('clicking the close button closes the modal', () => {
      openFirstRow();

      (fixture.nativeElement.querySelector('.modal-close-btn') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeNull();
    });

    it('clicking the backdrop closes the modal, but clicking inside the panel does not', () => {
      openFirstRow();

      (fixture.nativeElement.querySelector('.modal-panel') as HTMLElement).click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeTruthy();

      (fixture.nativeElement.querySelector('.modal-backdrop') as HTMLElement).click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeNull();
    });

    it('pressing Escape on the backdrop closes the modal', () => {
      openFirstRow();

      const backdrop = fixture.nativeElement.querySelector('.modal-backdrop') as HTMLElement;
      backdrop.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeNull();
    });

    it('pressing Enter inside the panel does not close the modal', () => {
      openFirstRow();

      const panel = fixture.nativeElement.querySelector('.modal-panel') as HTMLElement;
      panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeTruthy();
    });

    it('clicking the Listings link in the modal navigates to the filtered products page', () => {
      openFirstRow();

      (fixture.nativeElement.querySelector('.modal-stat-link') as HTMLButtonElement).click();

      expect(router.navigate).toHaveBeenCalledWith(['/admin/products'], {
        queryParams: { merchantId: 1, merchantName: 'shopA' },
      });
    });

    it('clicking a row action button updates status without opening the modal', () => {
      adminMerchantService.updateStatus.mockReturnValue(of(merchant({ id: 1, status: 'SUSPENDED' })));

      const rowActionBtn = fixture.nativeElement.querySelector('.table-row .col-actions .action-btn') as HTMLButtonElement;
      rowActionBtn.click();
      fixture.detectChanges();

      expect(adminMerchantService.updateStatus).toHaveBeenCalledWith(1, 'SUSPENDED');
      expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeNull();
    });

    it('clicking a status action button inside the modal calls setStatus', () => {
      adminMerchantService.updateStatus.mockReturnValue(of(merchant({ id: 1, status: 'SUSPENDED' })));
      openFirstRow();

      const modalActionBtn = fixture.nativeElement.querySelector('.modal-actions .action-btn') as HTMLButtonElement;
      modalActionBtn.click();
      fixture.detectChanges();

      expect(adminMerchantService.updateStatus).toHaveBeenCalledWith(1, 'SUSPENDED');
    });

    it('typing in the search box filters the table via the real ngModel binding', () => {
      const input = fixture.nativeElement.querySelector('#merchant-search') as HTMLInputElement;
      input.value = 'shopb';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.searchTerm()).toBe('shopb');
      const rows = fixture.nativeElement.querySelectorAll('.table-row:not(.table-row--head)');
      expect(rows).toHaveLength(1);
      expect(rows[0].textContent).toContain('shopB');
    });

    it('changing the status filter select updates the table via the real ngModel binding', () => {
      const select = fixture.nativeElement.querySelector('#merchant-status') as HTMLSelectElement;
      select.value = 'SUSPENDED';
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(component.selectedStatus()).toBe('SUSPENDED');
      const rows = fixture.nativeElement.querySelectorAll('.table-row:not(.table-row--head)');
      expect(rows).toHaveLength(1);
      expect(rows[0].textContent).toContain('shopC');
    });

    it('shows the loading state while detail is in flight, then the revenue amount once it resolves', () => {
      const detail$ = new Subject<AdminMerchantDetail>();
      adminMerchantService.getMerchantDetail.mockReturnValue(detail$);

      openFirstRow();

      expect(fixture.nativeElement.querySelector('.modal-panel')?.textContent).toContain('…');

      detail$.next(merchantDetail({ id: 1, revenue: 42.5 }));
      detail$.complete();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.modal-panel')?.textContent).toContain('$42.50');
    });

    it('shows a dash for revenue when the detail request fails', () => {
      adminMerchantService.getMerchantDetail.mockReturnValue(throwError(() => new Error('boom')));

      openFirstRow();

      expect(fixture.nativeElement.querySelector('.modal-panel')?.textContent).toContain('—');
    });
  });

  describe('DOM interactions - pagination', () => {
    beforeEach(() => {
      // pageSize is a plain field, not a signal - totalPages/pagedMerchants only recompute
      // when one of their *signal* dependencies changes, so pageSize must be set before the
      // first detectChanges() (which is what first reads/caches these computeds via the
      // template). This is why this describe has its own beforeEach instead of sharing the
      // one above, which already calls detectChanges() before each test body runs.
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
