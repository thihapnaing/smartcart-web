import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MerchantProductService } from '../../../../services/merchant-product-service';
import { ProductSearchResult } from '../../../../models/product-search-result';

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
    this.productService.activateProduct(id).subscribe(() => {
      this.refreshList();
    });
  }

  protected onDeactivate(id: number): void {
    this.productService.deactivateProduct(id).subscribe(() => {
      this.refreshList();
    });
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
