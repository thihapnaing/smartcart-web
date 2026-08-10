import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ProductService } from '../../services/product';
import { ProductSearchResult } from '../../models/product-search-result';

@Component({
  selector: 'app-search-results',
  imports: [RouterLink],
  templateUrl: './search-results.html',
  styleUrl: './search-results.css',
})
export class SearchResults implements OnInit {
  results = signal<ProductSearchResult[]>([]);
  searched = signal(false);

  // Image search
  imageSearchPrediction = signal('');
  imageSearchLabel = signal('');
  imageSearchMode = signal(false);

  constructor(
    private readonly productService: ProductService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    // =========================================================
    // STEP 5: CHECK IMAGE SEARCH RESULTS FIRST
    // =========================================================

    const navigation = this.router.getCurrentNavigation();

    const navigationState = navigation?.extras?.state;

    const browserState = history.state;

    const state = (
      navigationState ?? browserState
    ) as {
      imageSearchResults?: ProductSearchResult[];
      imageSearchPrediction?: string;
      imageSearchLabel?: string;
    };

    console.log('========== SEARCH RESULTS PAGE ==========');
    console.log('Navigation state:', state);

    if (state?.imageSearchResults) {
      console.log('========== IMAGE SEARCH RESULTS ==========');
      console.log('Received image results:', state.imageSearchResults);
      console.log('Number of image results:', state.imageSearchResults.length);

      this.imageSearchMode.set(true);

      this.imageSearchPrediction.set(state.imageSearchPrediction ?? '');

      this.imageSearchLabel.set(state.imageSearchLabel ?? '');

      this.loadImageSearchProducts(state.imageSearchResults);

      // IMPORTANT:
      // Do not run normal keyword search after image search.
      return;
    }

    // =========================================================
    // NORMAL KEYWORD SEARCH
    // =========================================================

    this.route.queryParamMap.subscribe((params) => {
      const keyword = params.get('keyword');

      console.log('Keyword:', keyword);

      if (keyword) {
        this.runSearch(keyword);
      }
    });
  }

  // =========================================================
  // NORMAL PRODUCT SEARCH
  // =========================================================

  private runSearch(keyword: string): void {
    console.log('========== NORMAL PRODUCT SEARCH ==========');
    console.log('Keyword:', keyword);

    this.productService.searchProducts(keyword).subscribe({
      next: (data) => {
        console.log('Normal search products:', data);
        console.log('Number of products:', data.length);

        this.results.set(data);
        this.searched.set(true);
      },

      error: (error) => {
        console.error('Normal product search failed:', error);

        this.results.set([]);
        this.searched.set(true);
      },
    });
  }

  // =========================================================
  // IMAGE SEARCH
  // =========================================================

  private loadImageSearchProducts(imageResults: ProductSearchResult[]): void {
    console.log('========== IMAGE SEARCH PRODUCTS ==========');

    console.log('Received products:', imageResults);

    console.log('Number of products:', imageResults?.length);

    if (!imageResults || imageResults.length === 0) {
      console.log('No products returned from image search.');

      this.results.set([]);
      this.searched.set(true);

      return;
    }

    // Backend already returns ProductSearchResult[]
    this.results.set(imageResults);

    this.searched.set(true);

    console.log('========== PRODUCTS FOR DISPLAY ==========');

    console.log('results():', this.results());
  }
}
