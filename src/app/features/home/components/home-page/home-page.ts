// Author: Htet Nandar (Grace)
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../../services/product';
import { ProductSearchResult } from '../../../../models/product-search-result';
import { ProductMiniCard } from '../../../chat/components/product-mini-card/product-mini-card';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css'
})
export class HomePage implements OnInit {
  products = signal<ProductSearchResult[]>([]);
  isLoading = signal<boolean>(true);

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.productService.browse({ newestFirst: true, limit: 20 }).subscribe({
      next: (res) => {
        this.products.set(res);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
