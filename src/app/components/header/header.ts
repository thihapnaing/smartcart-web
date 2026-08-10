import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart';
import {
  ImageSearchService,
  ProductSearchResult,
} from '../../services/image-search.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, FormsModule],
  templateUrl: './header.html',
})
export class Header {
  searchKeyword = signal('');

  imageSearchMessage = signal('');

  imageSearching = signal(false);

  selectedImageFile: File | null = null;

  selectedImageUrl = signal<string | null>(null);

  constructor(
    private readonly router: Router,
    protected readonly cart: CartService,
    private readonly imageSearchService: ImageSearchService,
  ) {}

  onSearch(): void {
    const trimmedKeyword = this.searchKeyword().trim();

    if (!trimmedKeyword) {
      return;
    }

    this.router.navigate(['/search'], {
      queryParams: {
        keyword: trimmedKeyword,
      },
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selectedFile = input.files?.[0];

    if (!selectedFile) {
      return;
    }

    console.log('Selected image:', selectedFile.name);

    if (!selectedFile.type.startsWith('image/')) {
      this.imageSearchMessage.set('Please select a valid image file.');
      input.value = '';
      return;
    }

    this.selectedImageFile = selectedFile;

    this.selectedImageUrl.set(URL.createObjectURL(selectedFile));

    this.imageSearchMessage.set('');

    // DO NOT search here.
    // The user will click the Search button.

    input.value = '';
  }

  searchByImage(): void {
    if (!this.selectedImageFile) {
      return;
    }

    console.log('========== ANGULAR IMAGE SEARCH ==========');
    console.log('Sending:', this.selectedImageFile.name);

    this.imageSearching.set(true);
    this.imageSearchMessage.set('');

    this.imageSearchService.searchByImage(this.selectedImageFile).subscribe({
      next: (products: ProductSearchResult[]) => {
        console.log('========== IMAGE SEARCH SUCCESS ==========');
        console.log('IMAGE SEARCH RESULTS:', products);
        console.log('RESULT TYPE:', typeof products);
        console.log('IS ARRAY:', Array.isArray(products));
        console.log('RESULT COUNT:', products?.length);

        if (Array.isArray(products) && products.length > 0) {
          console.log('FIRST PRODUCT:', products[0]);
        }

        this.imageSearching.set(false);

        console.log('Products found:', products.length);

        if (products.length === 0) {
          this.imageSearchMessage.set('No matching products found.');
          return;
        }

        this.router.navigate(['/search'], {
          state: {
            imageSearchResults: products,
          },
        });
      },

      error: (error) => {
        console.error('========== IMAGE SEARCH ERROR ==========');
        console.error(error);

        this.imageSearching.set(false);

        this.imageSearchMessage.set(
          error?.error?.message || 'Image search failed. Please try again.',
        );
      },
    });
  }

  openImagePicker(): void {
    const input = document.getElementById('header-image-input') as HTMLInputElement;

    input?.click();
  }
}
