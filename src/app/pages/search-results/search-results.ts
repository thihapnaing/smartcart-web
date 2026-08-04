import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product';
import { ProductSearchResult } from '../../models/product-search-result';

@Component({
  selector: 'app-search-results',
  imports: [FormsModule, RouterLink],
  templateUrl: './search-results.html',
  styleUrl: './search-results.css',
})
export class SearchResults {
  keyword: string = '';
  results = signal<ProductSearchResult[]>([]);
  searched = signal(false);

  constructor(private productService: ProductService) {}

  onSearch(): void {
    if (!this.keyword.trim()) return;
    this.productService.searchProducts(this.keyword).subscribe(data => {
      this.results.set(data);
      this.searched.set(true);
    });
  }
}