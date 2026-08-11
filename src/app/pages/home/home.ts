import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product';
import { ProductSearchResult } from '../../models/product-search-result';

// AI Recommendations
import { RecommendationService } from '../../services/recommendation.service';
import { RecommendationResult } from '../../models/recommendation.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  products = signal<ProductSearchResult[]>([]);
  loading = signal(true);

  // Add signals for the AI recommendations
  recommendations = signal<RecommendationResult | null>(null);

  categories = ['Tops', 'Bottoms', 'Shoes'];

  constructor(
    private readonly productService: ProductService,
    // Inject the Recommendation Service
    private readonly recommendationService: RecommendationService,
  ) {}

  ngOnInit(): void {
    this.productService.searchProducts('').subscribe({
      next: (results) => {
        this.products.set(results);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });

    // Fetch AI recommendations (Hardcoding User ID 2 for testing Grace's profile)
    this.recommendationService.getRecommendations(2).subscribe({
      next: (result) => {
        this.recommendations.set(result);
      },
      error: (err) => {
        console.error('Failed to load AI recommendations', err);
      },
    });
  }
}
