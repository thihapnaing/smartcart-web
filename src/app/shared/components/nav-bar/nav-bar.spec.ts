import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
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
  let cartItemCount: ReturnType<typeof signal<number>>;

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
    localStorage.clear();
    productService = { detectImageSearchLabel: vi.fn() };
    cartItemCount = signal(0);

    await TestBed.configureTestingModule({
      imports: [NavBar],
      providers: [
        // A wildcard route (rather than []) so that real routerLink clicks in the "DOM
        // interactions" tests below (brand, nav links, cart icon) resolve instead of throwing
        // NG04002 "Cannot match any routes" - nothing here ever renders a <router-outlet>, so
        // what the route points to doesn't matter.
        provideRouter([{ path: '**', component: NavBar }]),
        { provide: CartService, useValue: { itemCount: cartItemCount } },
        { provide: ProductService, useValue: productService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavBar);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
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

  // These drive the actual rendered template (clicks, keyboard events, ngModel, file input
  // change events) instead of calling component methods directly, so the click/keydown/change
  // listeners Angular generates from nav-bar.html - and the *ngIf branches they gate - are the
  // ones under test here, not just the plain TS methods behind them.
  describe('DOM interactions', () => {
    const openMenu = () => {
      (fixture.nativeElement.querySelector('.menu-toggle') as HTMLButtonElement).click();
      fixture.detectChanges();
    };

    const openImageSearch = () => {
      (fixture.nativeElement.querySelector('.nav-search-camera') as HTMLButtonElement).click();
      fixture.detectChanges();
    };

    const uploadFile = async (file: File) => {
      const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      await waitForFileReader();
      fixture.detectChanges();
    };

    it('clicking the menu toggle opens and closes the collapsible nav and swaps the icon', () => {
      const toggle = fixture.nativeElement.querySelector('.menu-toggle') as HTMLButtonElement;
      const collapsible = fixture.nativeElement.querySelector('.nav-collapsible') as HTMLElement;
      expect(collapsible.classList.contains('open')).toBe(false);
      expect(toggle.getAttribute('aria-expanded')).toBe('false');

      toggle.click();
      fixture.detectChanges();

      expect(component.menuOpen).toBe(true);
      expect(collapsible.classList.contains('open')).toBe(true);
      expect(toggle.getAttribute('aria-expanded')).toBe('true');

      toggle.click();
      fixture.detectChanges();

      expect(component.menuOpen).toBe(false);
      expect(collapsible.classList.contains('open')).toBe(false);
    });

    it('clicking the brand link closes the menu', () => {
      openMenu();
      expect(component.menuOpen).toBe(true);

      (fixture.nativeElement.querySelector('.brand') as HTMLElement).click();
      fixture.detectChanges();

      expect(component.menuOpen).toBe(false);
    });

    it('clicking a nav link closes the menu', () => {
      openMenu();

      (fixture.nativeElement.querySelector('.nav-link') as HTMLElement).click();
      fixture.detectChanges();

      expect(component.menuOpen).toBe(false);
    });

    it('pressing Enter in the search box navigates to /search with the trimmed keyword', () => {
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      const input = fixture.nativeElement.querySelector('#nav-search-input') as HTMLInputElement;

      input.value = '  tee  ';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
      fixture.detectChanges();

      expect(router.navigate).toHaveBeenCalledWith(['/search'], { queryParams: { keyword: 'tee' } });
      // Component state, not input.value: reading the DOM value back after ngModel writes it
      // has proven unreliable in this test environment (see the similar note in
      // chat-widget.spec.ts) - component.searchKeyword is what onSearch() actually clears.
      expect(component.searchKeyword).toBe('');
    });

    it('shows the cart badge only when itemCount is greater than 0', () => {
      expect(fixture.nativeElement.querySelector('.cart-badge')).toBeNull();

      cartItemCount.set(3);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.cart-badge');
      expect(badge).toBeTruthy();
      expect(badge.textContent).toContain('3');
    });

    it('clicking the cart icon closes the menu', () => {
      openMenu();

      (fixture.nativeElement.querySelector('.cart-btn') as HTMLElement).click();
      fixture.detectChanges();

      expect(component.menuOpen).toBe(false);
    });

    describe('account menu', () => {
      const openAccountMenu = () => {
        (fixture.nativeElement.querySelector('.account-container .icon-btn') as HTMLButtonElement).click();
        fixture.detectChanges();
      };

      it('opening it while logged out shows the sign-in view, and Sign In navigates to /login', () => {
        vi.spyOn(router, 'navigate').mockResolvedValue(true);

        openAccountMenu();

        expect(component.accountMenuOpen).toBe(true);
        expect(fixture.nativeElement.querySelector('.not-logged-in')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('.logged-in')).toBeNull();

        (fixture.nativeElement.querySelector('.account-signin') as HTMLButtonElement).click();
        fixture.detectChanges();

        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        expect(component.accountMenuOpen).toBe(false);
      });

      it('opening it while logged in shows the username/email, and Logout clears the session and navigates to /login', () => {
        localStorage.setItem('token', 'fake-token');
        localStorage.setItem('username', 'grace');
        localStorage.setItem('email', 'grace@example.com');
        vi.spyOn(component.authService, 'logout');
        vi.spyOn(router, 'navigate').mockResolvedValue(true);

        openAccountMenu();

        const panel = fixture.nativeElement.querySelector('.account-menu') as HTMLElement;
        expect(panel.querySelector('.not-logged-in')).toBeNull();
        expect(panel.querySelector('.account-username')?.textContent).toContain('grace');
        expect(panel.querySelector('.logged-in-label')?.textContent).toContain('grace@example.com');

        (fixture.nativeElement.querySelector('.account-logout') as HTMLButtonElement).click();
        fixture.detectChanges();

        expect(component.authService.logout).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
      });
    });

    describe('image search dialog', () => {
      it('the camera button opens the dialog, and clicking outside it (but not inside) closes it', () => {
        expect(fixture.nativeElement.querySelector('.image-search-overlay')).toBeNull();

        openImageSearch();
        expect(fixture.nativeElement.querySelector('.image-search-overlay')).toBeTruthy();

        (fixture.nativeElement.querySelector('.image-search-dialog') as HTMLElement).click();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.image-search-overlay')).toBeTruthy();

        (fixture.nativeElement.querySelector('.image-search-overlay') as HTMLElement).click();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.image-search-overlay')).toBeNull();
      });

      it('pressing Escape on the overlay or the dialog closes it', () => {
        openImageSearch();
        fixture.nativeElement
          .querySelector('.image-search-overlay')
          .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.image-search-overlay')).toBeNull();

        openImageSearch();
        fixture.nativeElement
          .querySelector('.image-search-dialog')
          .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.image-search-overlay')).toBeNull();
      });

      it('the close (x) button closes the dialog', () => {
        openImageSearch();

        (fixture.nativeElement.querySelector('.image-search-dialog__close') as HTMLButtonElement).click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.image-search-overlay')).toBeNull();
      });

      it('the Cancel button closes the dialog', () => {
        openImageSearch();

        (fixture.nativeElement.querySelector('.image-search-dialog__actions button') as HTMLButtonElement).click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.image-search-overlay')).toBeNull();
      });

      it('selecting a non-image file via the real file input shows the error message', async () => {
        openImageSearch();

        await uploadFile(new File(['x'], 'doc.pdf', { type: 'application/pdf' }));

        const error = fixture.nativeElement.querySelector('.image-search-error');
        expect(error?.textContent).toContain('Please select a valid image file.');
      });

      it('selecting a valid image via the real file input shows the preview, and Remove photo clears it', async () => {
        openImageSearch();
        expect(fixture.nativeElement.querySelector('.image-search-upload')).toBeTruthy();

        await uploadFile(imageFile());

        expect(fixture.nativeElement.querySelector('.image-search-upload')).toBeNull();
        const preview = fixture.nativeElement.querySelector('.image-search-preview');
        expect(preview).toBeTruthy();

        (preview.querySelector('button') as HTMLButtonElement).click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.image-search-preview')).toBeNull();
        expect(fixture.nativeElement.querySelector('.image-search-upload')).toBeTruthy();
      });

      it('the Search button is disabled until a preview exists, shows Searching... while in flight, then navigates on success', async () => {
        openImageSearch();
        const searchBtn = () => fixture.nativeElement.querySelector('.image-search-dialog__actions button:last-child') as HTMLButtonElement;
        expect(searchBtn().disabled).toBe(true);

        await uploadFile(imageFile());
        expect(searchBtn().disabled).toBe(false);

        const response$ = new Subject<ImageSearchResponse>();
        productService.detectImageSearchLabel.mockReturnValue(response$);
        vi.spyOn(router, 'navigate').mockResolvedValue(true);

        searchBtn().click();
        fixture.detectChanges();

        expect(searchBtn().disabled).toBe(true);
        expect(searchBtn().textContent).toContain('Searching...');

        const fakeProducts: ProductSearchResult[] = [{ id: 1, name: 'Blue Shirt' } as ProductSearchResult];
        response$.next({
          prediction: 'shirt',
          searchLabel: 'blue shirt',
          gender: 'MEN',
          color: 'blue',
          category: 'Tops',
          products: fakeProducts,
        } as ImageSearchResponse);
        response$.complete();
        fixture.detectChanges();

        expect(router.navigate).toHaveBeenCalledWith(
          ['/search'],
          expect.objectContaining({ state: expect.objectContaining({ imageSearchResults: fakeProducts }) })
        );
        expect(fixture.nativeElement.querySelector('.image-search-overlay')).toBeNull();
      });
    });
  });
});
