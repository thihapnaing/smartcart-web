// Author: Htet Nandar (Grace)
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {RouterLinkActive, Router, RouterLink} from '@angular/router';
import { CartService } from '../../../services/cart';

/**
 * Top nav bar. Women/Men link to /search filtered by gender, Categories browses
 * everything, and the search box does a free-text search - all backed by
 * ProductService.browse()/searchProducts() on the /search page.
 */
@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css'
})
export class NavBar {
  // Below 768px the links + search collapse behind a hamburger toggle.
  menuOpen = false;

  searchKeyword = '';

  // public so the template can read cartService.itemCount() directly for the badge.
  constructor(
    public cartService: CartService,
    private readonly router: Router
  ) {}

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  // Ported from the team's Header - matches the "keyword" query param SearchResults
  // actually reads (see search-results.ts), so this hits real results end-to-end.
  onSearch(): void {
    const trimmed = this.searchKeyword.trim();
    if (!trimmed) return;
    this.router.navigate(['/search'], { queryParams: { keyword: trimmed } });
    this.searchKeyword = '';
    this.closeMenu();
  }
}
