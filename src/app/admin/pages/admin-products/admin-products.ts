import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminProductService } from '../../services/admin-product';
import { AdminProductSummary } from '../../models/admin-product-summary';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.css',
})
export class AdminProducts implements OnInit {
  products = signal<AdminProductSummary[]>([]);
  loading = signal(true);
  updatingId = signal<number | null>(null);
  bulkUpdating = signal(false);

  searchTerm = signal('');
  selectedCategory = signal('All');
  selectedGender = signal('All');
  selectedStatus = signal('All');
  dateFrom = signal('');
  dateTo = signal('');
  currentPage = signal(1);
  pageSize = 8;

  selectedIds = signal<Set<number>>(new Set());

  // Set when arriving here via "Listings" in a merchant's detail modal (?merchantId=&merchantName=)
  // - filters to just that merchant's products, on top of whatever else is selected above.
  merchantIdFilter = signal<number | null>(null);
  merchantNameFilter = signal<string | null>(null);

  categories = computed(() => {
    const names = new Set(this.products().map(p => p.categoryName));
    return ['All', ...Array.from(names).sort((a, b) => a.localeCompare(b))];
  });

  filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const category = this.selectedCategory();
    const gender = this.selectedGender();
    const status = this.selectedStatus();
    const from = this.dateFrom() ? new Date(this.dateFrom()) : null;
    // Include the whole "to" day, not just midnight.
    const to = this.dateTo() ? new Date(this.dateTo() + 'T23:59:59.999') : null;

    const merchantId = this.merchantIdFilter();

    return this.products().filter(p => {
      const matchesTerm = !term || p.name.toLowerCase().includes(term) || p.shopName.toLowerCase().includes(term);
      const matchesCategory = category === 'All' || p.categoryName === category;
      const matchesGender = gender === 'All' || p.gender === gender;
      const matchesStatus = status === 'All' || p.status === status;
      const createdAt = new Date(p.createdAt);
      const matchesFrom = !from || createdAt >= from;
      const matchesTo = !to || createdAt <= to;
      const matchesMerchant = merchantId === null || p.merchantId === merchantId;
      return matchesTerm && matchesCategory && matchesGender && matchesStatus && matchesFrom && matchesTo && matchesMerchant;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredProducts().length / this.pageSize)));

  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  pagedProducts = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return this.filteredProducts().slice(start, start + this.pageSize);
  });

  selectedCount = computed(() => this.selectedIds().size);

  allOnPageSelected = computed(() => {
    const page = this.pagedProducts();
    return page.length > 0 && page.every(p => this.selectedIds().has(p.id));
  });

  // Drives the bulk-bar button: if any selected product is still ACTIVE, the bulk action
  // deactivates (matching bulkDeactivate(), which only touches the ACTIVE ones in the
  // selection). Only when the whole selection is already INACTIVE do we switch to activating.
  selectedHasActive = computed(() => {
    const products = this.products();
    return Array.from(this.selectedIds()).some(id => products.find(p => p.id === id)?.status === 'ACTIVE');
  });

  constructor(
    private readonly adminProductService: AdminProductService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const merchantId = params.get('merchantId');
    if (merchantId !== null) {
      this.merchantIdFilter.set(Number(merchantId));
      this.merchantNameFilter.set(params.get('merchantName'));
    }

    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.adminProductService.getAllProducts().subscribe({
      next: (data) => {
        this.products.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.onFilterChange();
  }

  onCategoryChange(value: string): void {
    this.selectedCategory.set(value);
    this.onFilterChange();
  }

  onGenderChange(value: string): void {
    this.selectedGender.set(value);
    this.onFilterChange();
  }

  onStatusChange(value: string): void {
    this.selectedStatus.set(value);
    this.onFilterChange();
  }

  onDateFromChange(value: string): void {
    this.dateFrom.set(value);
    this.onFilterChange();
  }

  onDateToChange(value: string): void {
    this.dateTo.set(value);
    this.onFilterChange();
  }

  clearMerchantFilter(): void {
    this.merchantIdFilter.set(null);
    this.merchantNameFilter.set(null);
    this.currentPage.set(1);
    // Drop merchantId/merchantName from the URL too, so a refresh doesn't reapply the filter.
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategory.set('All');
    this.selectedGender.set('All');
    this.selectedStatus.set('All');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  toggleStatus(product: AdminProductSummary): void {
    const nextStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.updatingId.set(product.id);
    this.adminProductService.updateStatus(product.id, nextStatus).subscribe({
      next: (updated) => {
        this.products.update(list => list.map(p => (p.id === updated.id ? updated : p)));
        this.updatingId.set(null);
      },
      error: () => this.updatingId.set(null),
    });
  }

  toggleSelect(id: number): void {
    this.selectedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  toggleSelectAllOnPage(): void {
    const page = this.pagedProducts();
    const allSelected = this.allOnPageSelected();
    this.selectedIds.update(set => {
      const next = new Set(set);
      for (const p of page) {
        if (allSelected) {
          next.delete(p.id);
        } else {
          next.add(p.id);
        }
      }
      return next;
    });
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  bulkDeactivate(): void {
    const ids = Array.from(this.selectedIds()).filter(id => {
      const product = this.products().find(p => p.id === id);
      return product?.status === 'ACTIVE';
    });
    this.runBulkUpdate(ids, 'INACTIVE');
  }

  bulkActivate(): void {
    const ids = Array.from(this.selectedIds()).filter(id => {
      const product = this.products().find(p => p.id === id);
      return product?.status === 'INACTIVE';
    });
    this.runBulkUpdate(ids, 'ACTIVE');
  }

  private runBulkUpdate(ids: number[], status: 'ACTIVE' | 'INACTIVE'): void {
    if (ids.length === 0) return;

    this.bulkUpdating.set(true);
    forkJoin(ids.map(id => this.adminProductService.updateStatus(id, status))).subscribe({
      next: (updatedList) => {
        const updatedById = new Map(updatedList.map(product => [product.id, product]));
        this.products.update(list =>
          list.map(product => updatedById.get(product.id) ?? product)
        );
        this.clearSelection();
        this.bulkUpdating.set(false);
      },
      error: () => this.bulkUpdating.set(false),
    });
  }
}
