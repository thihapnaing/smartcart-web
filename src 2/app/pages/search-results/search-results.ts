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
  results = signal<ProductSearchResult[]>([]);
  searched = signal(false);

  constructor(
    private readonly productService: ProductService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Watches the "q" part of the URL (e.g. /search?q=shoes). Whenever it
    // changes — for example, because a new word was typed in the header —
    // this block runs and searches again automatically.
    this.route.queryParamMap.subscribe(params => {
      const keyword = params.get('q');
      if (keyword) {
        this.runSearch(keyword);
      }
    });
  }

  private runSearch(keyword: string): void {
    this.productService.searchProducts(keyword).subscribe(data => {
      this.results.set(data);
      this.searched.set(true);
    });
  }
}