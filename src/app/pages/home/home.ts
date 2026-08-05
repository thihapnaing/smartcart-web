import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product';
import { ProductSearchResult } from '../../models/product-search-result';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  products = signal<ProductSearchResult[]>([]);
  loading = signal(true);

  categories = ['Tops', 'Bottoms', 'Shoes'];

  constructor(private readonly productService: ProductService) {}

  ngOnInit(): void {
    this.productService.searchProducts('').subscribe({
      next: results => {
        this.products.set(results);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}