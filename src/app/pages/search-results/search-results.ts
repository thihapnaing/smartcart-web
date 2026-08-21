import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink, Router, NavigationEnd } from '@angular/router';
import { ProductService } from '../../services/product';
import { ProductSearchResult } from '../../models/product-search-result';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-search-results',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './search-results.html',
  styleUrl: './search-results.css',
})
export class SearchResults implements OnInit {
  // The list of products currently shown on screen.
  results = signal<ProductSearchResult[]>([]);

  // True while waiting for the server to reply. Used to show a loading message.
  loading = signal(true);

  //searched
  searched = signal(false);

  //image-search :: Junior
  imageSearchPrediction = signal('');
  imageSearchLabel = signal('');
  imageSearchMode = signal(false);

  // A short line describing what is being shown, e.g. "Women's Collection".
  // Displayed as the page heading.
  pageTitle = signal('All Products');

  constructor(
    private readonly productService: ProductService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    // Watches the extra information attached to the web address.
    // Examples of addresses this handles:
    //   /search?keyword=shoes
    //   /search?gender=WOMEN
    //   /search?category=Tops
    //   /search                     (no extras - shows everything)
    // Whenever the address changes, this block runs again automatically.
    // Handle the first page load :: Junior
    this.handleImageSearchState(history.state);

    // Handle image searches when we are already on /search :: Junior
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        console.log('========== NAVIGATION END ==========');

        console.log('Current URL:', this.router.url);

        console.log('Current history state:', history.state);

        this.handleImageSearchState(history.state);
      });

    this.route.queryParamMap.subscribe((params) => {
      const keyword = params.get('keyword');
      const gender = params.get('gender');
      const category = params.get('category');

      console.log('========== QUERY PARAM SEARCH ==========');
      console.log('keyword:', keyword);
      console.log('gender:', gender);
      console.log('category:', category);

      //check image search mode
      if (this.imageSearchMode()) {
        console.log('Image search mode active - skipping normal product search.');

        return;
      }

      //normal search
      this.imageSearchMode.set(false);

      this.pageTitle.set(this.buildPageTitle(keyword, gender, category));

      this.loadProducts(keyword, gender, category);
    });
  }

  // Asks the server for products that match whatever filters were given.
  private loadProducts(
    keyword: string | null,
    gender: string | null,
    category: string | null,
  ): void {
    this.loading.set(true);
    this.searched.set(false);

    // Build the list of filters to send.
    // Anything left out is simply not sent, and the server ignores it.
    const searchOptions: {
      keyword?: string;
      gender?: string;
      category?: string;
    } = {};

    if (keyword) {
      searchOptions.keyword = keyword;
    }
    if (gender) {
      searchOptions.gender = gender;
    }
    if (category) {
      searchOptions.category = category;
    }

    console.log('========== LOADING NORMAL PRODUCTS ==========');

    console.log('Search options:', searchOptions);

    this.productService.browse(searchOptions).subscribe({
      next: (data) => {
        this.results.set(data);
        this.loading.set(false);
      },
      error: () => {
        // If the server call fails, show an empty list rather than
        // leaving the page stuck on "Loading".
        this.results.set([]);
        this.loading.set(false);
        this.searched.set(true);
      },
    });
  }

  // Works out a friendly heading based on what was clicked.
  private buildPageTitle(
    keyword: string | null,
    gender: string | null,
    category: string | null,
  ): string {
    if (keyword) {
      return `Results for "${keyword}"`;
    }

    if (gender && category) {
      return `${this.formatGender(gender)} - ${category}`;
    }

    if (gender) {
      return `${this.formatGender(gender)} Collection`;
    }

    if (category) {
      return category;
    }

    return 'All Products';
  }

  // Turns the stored value "WOMEN" into the nicer display text "Women's".
  private formatGender(gender: string): string {
    if (gender.toUpperCase() === 'WOMEN') {
      return "Women's";
    }
    if (gender.toUpperCase() === 'MEN') {
      return "Men's";
    }
    return gender;
  }

  //Junior
  private handleImageSearchState(state: any): void {
    console.log('========== CHECK IMAGE SEARCH STATE ==========');

    console.log('State:', state);

    if (!state?.imageSearchResults) {
      return;
    }

    console.log('========== IMAGE SEARCH RESULTS ==========');

    console.log('Received image results:', state.imageSearchResults);

    console.log('Number of image results:', state.imageSearchResults.length);

    // Enable image-search mode.
    this.imageSearchMode.set(true);

    // Change page heading.
    this.pageTitle.set('Image Search Results');

    // CNN prediction.
    this.imageSearchPrediction.set(state.imageSearchPrediction ?? '');

    // Detected label.
    this.imageSearchLabel.set(state.imageSearchLabel ?? '');

    // Display the products returned by the backend.
    this.loadImageSearchProducts(state.imageSearchResults);
  }

  private loadImageSearchProducts(imageResults: ProductSearchResult[]): void {
    console.log('========== IMAGE SEARCH PRODUCTS ==========');

    console.log('Received products:', imageResults);

    console.log('Number of products:', imageResults?.length);

    // Stop loading spinner.
    this.loading.set(false);

    if (!imageResults || imageResults.length === 0) {
      console.log('No products returned from image search.');

      this.results.set([]);
      this.searched.set(true);

      return;
    }

    this.results.set(imageResults);

    this.searched.set(true);

    console.log('========== PRODUCTS FOR DISPLAY ==========');

    console.log('results():', this.results());
  }
}
