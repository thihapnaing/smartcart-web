import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MerchantProductService } from '../../../../services/merchant-product-service';
import { ProductSearchResult } from '../../../../models/product-search-result';
import { HttpErrorResponse } from '@angular/common/http';

interface ApiErrorResponse {
  code: string;
  message: string;
}

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './products-list.html',
  styleUrl: './products-list.css',
})

export class ProductsList implements OnInit {
  private readonly productService = inject(MerchantProductService);
  protected readonly products = signal<ProductSearchResult[]>([]);
  protected readonly activeTab = signal<'all' | 'active' | 'inactive'>('all');
  protected readonly searchKeyword = signal('');
  protected readonly selectedCategory = signal<string | null>(null);
  protected readonly selectedGender = signal<string | null>(null);
  protected readonly activationErrors = signal<Record<number, string>>({});

  protected readonly filteredProducts = computed(() => {
    let result = this.products();

    const tab = this.activeTab();
    if (tab === 'active') {
      result = result.filter(p => p.status === 'ACTIVE');
    } else if (tab === 'inactive') {
      result = result.filter(p => p.status === 'INACTIVE');
    }

    const keyword = this.searchKeyword().trim().toLowerCase();
    if(keyword) {
      result = result.filter(p => p.name.toLowerCase().includes(keyword));
    }

    const category = this.selectedCategory();
    if (category) {
      result = result.filter(p => p.categoryName === category)
    }

    const gender = this.selectedGender();
    if (gender) {
      result = result.filter(p => p.gender === gender);
    }

    return result;
  });

  protected readonly activeCount = computed(() => 
    this.products().filter(p => p.status === 'ACTIVE').length
  );

  protected readonly inactiveCount = computed(() =>
    this.products().filter(p => p.status === 'INACTIVE').length
  );

  protected readonly totalCount = computed(() => 
    this.products().length
  );

  protected setTab(tab: 'all' | 'active' | 'inactive'): void {
    this.activeTab.set(tab);
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchKeyword.set(value);
  }

  protected onCategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedCategory.set(value || null);
  }

  protected onGenderChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedGender.set(value || null);
  }

  protected onActivate(id: number): void {
    this.clearActivationError(id);

    this.productService.activateProduct(id).subscribe({
      next: () => this.refreshList(),
      error: (err) => {
        const message = this.resolveActivationError(err);
        this.activationErrors.update(map => ({ ...map, [id]: message }));
      },
    });
  }

  protected clearActivationError(id: number): void {
    this.activationErrors.update(map => {
      const {[id]: _, ...rest} = map;
      return rest;
    });
  }

  private resolveActivationError(err: any): string {
    const code = (err.error as ApiErrorResponse)?.code;
    if (code === 'ADMIN_LOCKED') {
      return 'This listing is locked by an admin and cannot be activated.';
    }
    return 'Unable to activate this product. Please try again.';
  }

  protected onDeactivate(id: number): void {
  this.clearActivationError(id);

  this.productService.deactivateProduct(id).subscribe({
    next: () => this.refreshList(),
    error: (err: HttpErrorResponse) => {
      const message = this.resolveDeactivationError(err);
      this.activationErrors.update(map => ({ ...map, [id]: message }));
    },
  });
}

private resolveDeactivationError(err: HttpErrorResponse): string {
  return 'Unable to deactivate this product. Please try again.';
}

  private refreshList(): void {
    this.productService.getMyProducts().subscribe(result => {
      this.products.set(result);
    })
  }

  ngOnInit(): void {
    this.refreshList();
  }

}
