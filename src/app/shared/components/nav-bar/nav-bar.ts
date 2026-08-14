// Author: Htet Nandar (Grace)
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service'; //Junior
import { CartService } from '../../../services/cart';
import { ProductService } from '../../../services/product';
import { ImageSearchResponse } from '../../../models/image-search-response'; //Junior

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
  username = '';
  accountMenuOpen = false;

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
    public readonly authService: AuthService, //Junior
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
  }

  toggleAccountMenu(): void {
    this.accountMenuOpen = !this.accountMenuOpen;
  }

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
      next: (response: ImageSearchResponse) => {
        console.log('========== IMAGE SEARCH RESPONSE ==========');

        console.log('Prediction:', response.prediction);

        console.log('Search label:', response.searchLabel);

        console.log('Gender:', response.gender);

        console.log('Color:', response.color);

        console.log('Category:', response.category);

        console.log('Products:', response.products);

        this.imageSearchLoading.set(false);

        if (!response.products || response.products.length === 0) {
          this.imageSearchError.set('No matching products found.');

          return;
        }

        // Close popup.
        this.imageSearchOpen.set(false);
        this.clearSelectedImage();

        // Pass complete AI response to SearchResults.
        this.router
          .navigate(['/search'], {
            state: {
              imageSearchResults: response.products,

              imageSearchPrediction: response.prediction,

              imageSearchLabel: response.searchLabel,

              imageSearchGender: response.gender,

              imageSearchColor: response.color,

              imageSearchCategory: response.category,
            },
            onSameUrlNavigation: 'reload',
          })
          .then((success) => {
            console.log('Navigation completed to /search:', success);
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

  logout(): void {
    console.log('LOGOUT BUTTON CLICKED');

    this.authService.logout();

    console.log('Logout successful');

    this.router.navigate(['/login']);
    this.closeMenu();
  }
}
