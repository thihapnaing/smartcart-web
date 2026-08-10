// Author: Htet Nandar (Grace)
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {RouterLinkActive, Router, RouterLink} from '@angular/router';
import { CartService } from '../../../services/cart';
import { signal } from '@angular/core'; //Junior
import { ProductService } from '../../../services/product'; //Junior

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
  styleUrl: './nav-bar.css',
})
export class NavBar {
  // Below 768px the links + search collapse behind a hamburger toggle.
  menuOpen = false;

  searchKeyword = '';

  //Junior
  imageSearchOpen = signal(false);
  imagePreviewUrl = signal<string | null>(null);
  imageSearchLoading = signal(false);
  imageSearchError = signal('');
  private selectedImageFile: File | null = null;

  // public so the template can read cartService.itemCount() directly for the badge.
  constructor(
    public cartService: CartService,
    private readonly router: Router,
    private readonly productService: ProductService, //Junior
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

  //Junior
  openImageSearch(): void {
    this.imageSearchOpen.set(true);
    this.imageSearchError.set('');
  }

  closeImageSearch(): void {
    this.imageSearchOpen.set(false);
    this.clearSelectedImage();
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.selectedImageFile = file;
    this.imageSearchError.set('');

    const reader = new FileReader();

    reader.onload = () => {
      this.imagePreviewUrl.set(reader.result as string);
    };

    reader.readAsDataURL(file);
  }

  clearSelectedImage(): void {
    this.selectedImageFile = null;
    this.imagePreviewUrl.set(null);
    this.imageSearchError.set('');
  }

  onImageSearch(): void {
    if (!this.selectedImageFile) {
      this.imageSearchError.set('Please select an image first.');
      return;
    }

    this.imageSearchLoading.set(true);
    this.imageSearchError.set('');

    this.productService.detectImageSearchLabel(this.selectedImageFile).subscribe({
      next: (result) => {
        this.imageSearchLoading.set(false);

        // Backend returns an array of products
        if (!result || !Array.isArray(result) || result.length === 0) {
          this.imageSearchError.set('No product could be detected.');
          return;
        }

        console.log('Image search results:', result);

        this.imageSearchOpen.set(false);
        this.clearSelectedImage();

        // Pass the returned products to the search-results page
        this.router.navigate(['/search'], {
          state: {
            imageSearchResults: result,
          },
        });

        this.closeMenu();
      },

      error: (error) => {
        console.error('Image search failed:', error);

        this.imageSearchLoading.set(false);
        this.imageSearchError.set('Image search failed. Please try again.');
      },
    });
  }
}
