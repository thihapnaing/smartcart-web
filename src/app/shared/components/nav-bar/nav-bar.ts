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
    this.imageSearchLoading.set(false);
  }

  closeImageSearch(): void {
    this.imageSearchOpen.set(false);
    this.selectedImageFile = null;
    this.imagePreviewUrl.set(null);
    this.imageSearchError.set('');
    this.imageSearchLoading.set(false);
  }

  resetImageFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = '';
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    console.log('Selected image:', file.name);
    console.log('Image type:', file.type);
    console.log('Image size:', file.size);

    if (!file.type.startsWith('image/')) {
      this.imageSearchError.set('Please select a valid image file.');
      input.value = '';
      return;
    }

    this.selectedImageFile = file;
    this.imageSearchError.set('');

    const reader = new FileReader();

    reader.onload = () => {
      console.log('Preview loaded:', file.name);
      this.imagePreviewUrl.set(reader.result as string);
    };

    reader.onerror = () => {
      console.error('Failed to read image:', file.name);
      this.imageSearchError.set('Could not read the selected image.');
    };

    reader.readAsDataURL(file);

    // Allow another image to be selected next time
    input.value = '';
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
      next: (result: any[]) => {
        console.log('Image search results:', result);

        this.imageSearchLoading.set(false);

        // Backend returns an array of products
        if (!result || result.length === 0) {
          this.imageSearchError.set('No product could be detected.');
          return;
        }

        // Get the detected category and colour from the first result
        const firstProduct = result[0];

        const category = firstProduct.categoryName?.trim();
        const color = firstProduct.color?.trim();

        console.log('Detected category:', category);
        console.log('Detected color:', color);

        if (!category || !color) {
          this.imageSearchError.set('Could not determine the product.');
          return;
        }

        // Build search keyword
        const keyword = `${color} ${category}`;

        console.log('Navigating to search:', keyword);

        // Close image-search popup
        this.imageSearchOpen.set(false);
        this.clearSelectedImage();

        // Go to search page
        this.router.navigate(['/search'], {
          queryParams: {
            keyword: keyword,
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
