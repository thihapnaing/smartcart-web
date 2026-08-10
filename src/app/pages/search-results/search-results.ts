import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product';
import { ProductSearchResult } from '../../models/product-search-result';

@Component({
  selector: 'app-search-results',
  imports: [RouterLink],
  templateUrl: './search-results.html',
  styleUrl: './search-results.css',
})
export class SearchResults implements OnInit {

  // The list of products currently shown on screen.
  results = signal<ProductSearchResult[]>([]);

  // True while waiting for the server to reply. Used to show a loading message.
  loading = signal(true);

  // A short line describing what is being shown, e.g. "Women's Collection".
  // Displayed as the page heading.
  pageTitle = signal('All Products');

  constructor(
    private readonly productService: ProductService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Watches the extra information attached to the web address.
    // Examples of addresses this handles:
    //   /search?keyword=shoes
    //   /search?gender=WOMEN
    //   /search?category=Tops
    //   /search                     (no extras - shows everything)
    // Whenever the address changes, this block runs again automatically.
    this.route.queryParamMap.subscribe(params => {

      // Read each possible piece of information from the address.
      // If a piece is missing, params.get(...) gives back null.
      const keyword = params.get('keyword');
      const gender = params.get('gender');
      const category = params.get('category');

      this.pageTitle.set(this.buildPageTitle(keyword, gender, category));
      this.loadProducts(keyword, gender, category);
    });
  }

  // Asks the server for products that match whatever filters were given.
  private loadProducts(
    keyword: string | null,
    gender: string | null,
    category: string | null
  ): void {

    this.loading.set(true);

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

    this.productService.browse(searchOptions).subscribe({
      next: data => {
        this.results.set(data);
        this.loading.set(false);
      },
      error: () => {
        // If the server call fails, show an empty list rather than
        // leaving the page stuck on "Loading".
        this.results.set([]);
        this.loading.set(false);
      }
    });
  }

  // Works out a friendly heading based on what was clicked.
  private buildPageTitle(
    keyword: string | null,
    gender: string | null,
    category: string | null
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
}