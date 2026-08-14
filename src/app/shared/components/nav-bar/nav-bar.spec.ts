import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { NavBar } from './nav-bar';
import { CartService } from '../../../services/cart';
import { ProductService } from '../../../services/product';
import { ImageSearchResponse } from '../../../models/image-search-response';
import { ProductSearchResult } from '../../../models/product-search-result';

describe('NavBar', () => {
  let fixture: ComponentFixture<NavBar>;
  let component: NavBar;
  let router: Router;
  let productService: { detectImageSearchLabel: ReturnType<typeof vi.fn> };

  const imageFile = () => new File(['fake-bytes'], 'shirt.png', { type: 'image/png' });

  // FileReader.readAsDataURL() completes asynchronously - poll instead of guessing a fixed
  // delay, since a plain setTimeout(0) isn't reliably long enough in jsdom.
  const waitForFileReader = () =>
    vi.waitFor(() => {
      if (component.imagePreviewUrl() === null && component.imageSearchError() === '') {
        throw new Error('still waiting for FileReader to finish');
      }
    });

  beforeEach(async () => {
    productService = { detectImageSearchLabel: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [NavBar],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: { itemCount: () => 0 } },
        { provide: ProductService, useValue: productService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavBar);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('menu toggling', () => {
    it('toggleMenu() flips menuOpen', () => {
      expect(component.menuOpen).toBe(false);
      component.toggleMenu();
      expect(component.menuOpen).toBe(true);
      component.toggleMenu();
      expect(component.menuOpen).toBe(false);
    });

    it('closeMenu() sets menuOpen to false', () => {
      component.menuOpen = true;
      component.closeMenu();
      expect(component.menuOpen).toBe(false);
    });
  });

  describe('onSearch', () => {
    it('does nothing when the search keyword is empty or whitespace', () => {
      vi.spyOn(router, 'navigate');
      component.searchKeyword = '   ';

      component.onSearch();

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('navigates to /search with the trimmed keyword and clears the input', () => {
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component.searchKeyword = '  tee  ';
      component.menuOpen = true;

      component.onSearch();

      expect(router.navigate).toHaveBeenCalledWith(['/search'], { queryParams: { keyword: 'tee' } });
      expect(component.searchKeyword).toBe('');
      expect(component.menuOpen).toBe(false);
    });
  });

  describe('openImageSearch / closeImageSearch', () => {
    it('openImageSearch() opens the dialog and clears error/loading state', () => {
      component.imageSearchError.set('stale error');
      component.imageSearchLoading.set(true);

      component.openImageSearch();

      expect(component.imageSearchOpen()).toBe(true);
      expect(component.imageSearchError()).toBe('');
      expect(component.imageSearchLoading()).toBe(false);
    });

    it('closeImageSearch() resets everything back to the initial state', () => {
      component.imageSearchOpen.set(true);
      component.imagePreviewUrl.set('data:image/png;base64,xyz');
      component.imageSearchError.set('some error');
      component.imageSearchLoading.set(true);

      component.closeImageSearch();

      expect(component.imageSearchOpen()).toBe(false);
      expect(component.imagePreviewUrl()).toBeNull();
      expect(component.imageSearchError()).toBe('');
      expect(component.imageSearchLoading()).toBe(false);
    });
  });

  describe('onImageFileSelected', () => {
    it('does nothing when no file was selected', () => {
      const input = document.createElement('input');
      input.type = 'file';

      component.onImageFileSelected({ target: input } as unknown as Event);

      expect(component.imagePreviewUrl()).toBeNull();
    });

    it('rejects non-image files with an error and resets the input', () => {
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', {
        value: [new File(['x'], 'doc.pdf', { type: 'application/pdf' })],
      });
      input.value = 'C:\\fakepath\\doc.pdf';

      component.onImageFileSelected({ target: input } as unknown as Event);

      expect(component.imageSearchError()).toBe('Please select a valid image file.');
      expect(input.value).toBe('');
    });

    it('accepts a valid image file and loads a preview URL', async () => {
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [imageFile()] });

      component.onImageFileSelected({ target: input } as unknown as Event);
      await waitForFileReader();

      expect(component.imageSearchError()).toBe('');
      expect(component.imagePreviewUrl()).toContain('data:image/png;base64');
    });
  });

  describe('clearSelectedImage', () => {
    it('clears the preview and error state', async () => {
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [imageFile()] });
      component.onImageFileSelected({ target: input } as unknown as Event);
      await waitForFileReader();

      component.clearSelectedImage();

      expect(component.imagePreviewUrl()).toBeNull();
      expect(component.imageSearchError()).toBe('');
    });
  });

  describe('onImageSearch', () => {
    it('sets an error when no image has been selected', () => {
      component.onImageSearch();

      expect(component.imageSearchError()).toBe('Please select an image first.');
      expect(productService.detectImageSearchLabel).not.toHaveBeenCalled();
    });

    it('sets an error when the AI service returns no matching products', async () => {
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [imageFile()] });
      component.onImageFileSelected({ target: input } as unknown as Event);
      await waitForFileReader();

      productService.detectImageSearchLabel.mockReturnValue(
        of({ prediction: 'shirt', searchLabel: 'shirt', gender: '', color: '', category: '', products: [] } as ImageSearchResponse)
      );

      component.onImageSearch();

      expect(component.imageSearchLoading()).toBe(false);
      expect(component.imageSearchError()).toBe('No matching products found.');
    });

    it('navigates to /search with the AI results, closes the dialog, and closes the menu on success', async () => {
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [imageFile()] });
      component.onImageFileSelected({ target: input } as unknown as Event);
      await waitForFileReader();

      const fakeProducts: ProductSearchResult[] = [{ id: 1, name: 'Blue Shirt' } as ProductSearchResult];
      productService.detectImageSearchLabel.mockReturnValue(
        of({
          prediction: 'shirt',
          searchLabel: 'blue shirt',
          gender: 'MEN',
          color: 'blue',
          category: 'Tops',
          products: fakeProducts,
        } as ImageSearchResponse)
      );
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component.menuOpen = true;

      component.onImageSearch();

      expect(router.navigate).toHaveBeenCalledWith(
        ['/search'],
        expect.objectContaining({
          state: expect.objectContaining({ imageSearchResults: fakeProducts, imageSearchLabel: 'blue shirt' }),
        })
      );
      expect(component.imageSearchOpen()).toBe(false);
      expect(component.menuOpen).toBe(false);
    });

    it('sets a friendly error when the AI service call fails', async () => {
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [imageFile()] });
      component.onImageFileSelected({ target: input } as unknown as Event);
      await waitForFileReader();

      productService.detectImageSearchLabel.mockReturnValue(throwError(() => new Error('boom')));

      component.onImageSearch();

      expect(component.imageSearchLoading()).toBe(false);
      expect(component.imageSearchError()).toBe('Image search failed. Please try again.');
    });
  });
});
