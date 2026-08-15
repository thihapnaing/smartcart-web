import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminMerchantService } from '../../services/admin-merchant';
import { AdminMerchantDetail, AdminMerchantSummary, MerchantStatus } from '../../models/admin-merchant-summary';

// AUTHOR: Htet Nandar(Grace)
/**
 * As an admin, I want to manage merchant accounts so that I can suspend accounts that violate
 * policy and reinstate them later.
 */
@Component({
  selector: 'app-admin-merchants',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-merchants.html',
  styleUrl: './admin-merchants.css',
})
export class AdminMerchants implements OnInit {
  merchants = signal<AdminMerchantSummary[]>([]);
  loading = signal(true);
  updatingId = signal<number | null>(null);
  selectedMerchant = signal<AdminMerchantSummary | null>(null);
  merchantDetail = signal<AdminMerchantDetail | null>(null);
  detailLoading = signal(false);

  searchTerm = signal('');
  selectedStatus = signal<'All' | MerchantStatus>('All');
  currentPage = signal(1);
  pageSize = 8;

  filteredMerchants = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.selectedStatus();

    return this.merchants().filter((m) => {
      const matchesTerm =
        !term || m.username.toLowerCase().includes(term) || m.email.toLowerCase().includes(term);
      const matchesStatus = status === 'All' || m.status === status;
      return matchesTerm && matchesStatus;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredMerchants().length / this.pageSize)));

  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  pagedMerchants = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return this.filteredMerchants().slice(start, start + this.pageSize);
  });

  constructor(
    private readonly adminMerchantService: AdminMerchantService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadMerchants();
  }

  private loadMerchants(): void {
    this.loading.set(true);
    this.adminMerchantService.getAllMerchants().subscribe({
      next: (data) => {
        this.merchants.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  onStatusFilterChange(value: 'All' | MerchantStatus): void {
    this.selectedStatus.set(value);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  // Detail modal - opens instantly with the summary already held in `merchants()` (username,
  // email, joined date, status, listing count), then fetches orders/revenue separately since
  // those aren't part of the list-row payload and would be wasted work for rows never opened.
  openDetail(merchant: AdminMerchantSummary): void {
    this.selectedMerchant.set(merchant);
    this.merchantDetail.set(null);
    this.detailLoading.set(true);

    this.adminMerchantService.getMerchantDetail(merchant.id).subscribe({
      next: (detail) => {
        this.merchantDetail.set(detail);
        this.detailLoading.set(false);
      },
      error: () => this.detailLoading.set(false),
    });
  }

  closeDetail(): void {
    this.selectedMerchant.set(null);
    this.merchantDetail.set(null);
  }

  // "Listings" in the detail modal jumps to the products screen pre-filtered to just this
  // merchant, via merchantId (the reliable identifier) plus merchantName for the banner text.
  viewListings(merchant: AdminMerchantSummary): void {
    this.router.navigate(['/admin/products'], {
      queryParams: { merchantId: merchant.id, merchantName: merchant.username },
    });
  }

  // What buttons a row should offer, given its current status - kept in one place so the
  // template doesn't have to re-derive this per status with a pile of @if branches.
  nextActions(status: MerchantStatus): { label: string; status: MerchantStatus; tone: 'positive' | 'negative' }[] {
    switch (status) {
      case 'ACTIVE':
        return [{ label: 'Suspend', status: 'SUSPENDED', tone: 'negative' }];
      case 'SUSPENDED':
        return [{ label: 'Reactivate', status: 'ACTIVE', tone: 'positive' }];
      case 'INACTIVE':
        return [{ label: 'Activate', status: 'ACTIVE', tone: 'positive' }];
      default:
        return [];
    }
  }

  setStatus(merchant: AdminMerchantSummary, status: MerchantStatus): void {
    this.updatingId.set(merchant.id);
    this.adminMerchantService.updateStatus(merchant.id, status).subscribe({
      next: (updated) => {
        this.merchants.update((list) => list.map((m) => (m.id === updated.id ? updated : m)));
        if (this.selectedMerchant()?.id === updated.id) {
          this.selectedMerchant.set(updated);
          this.merchantDetail.update((d) => (d ? { ...d, status: updated.status } : d));
        }
        this.updatingId.set(null);
      },
      error: () => this.updatingId.set(null),
    });
  }
}
