import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { of, throwError } from 'rxjs';

import { NavBar } from './nav-bar';

import { CartService } from '../../../services/cart';
import { ProductService } from '../../../services/product';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

describe('NavBar', () => {
  let component: NavBar;

  let cartServiceMock: any;

  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };

  let productServiceMock: any;

  let authServiceMock: {
    getUsername: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  // =========================================================
  // SETUP
  // =========================================================

  beforeEach(() => {
    localStorage.clear();

    cartServiceMock = {
      itemCount: vi.fn().mockReturnValue(0),
    };

    routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    productServiceMock = {
      detectImageSearchLabel: vi.fn(),
    };

    authServiceMock = {
      getUsername: vi.fn().mockReturnValue('john'),

      logout: vi.fn(),
    };

    component = new NavBar(
      cartServiceMock as CartService,

      routerMock as unknown as Router,

      productServiceMock as ProductService,

      authServiceMock as unknown as AuthService,
    );
  });

  // =========================================================
  // CLEANUP
  // =========================================================

  afterEach(() => {
    localStorage.clear();

    vi.restoreAllMocks();
  });

  // =========================================================
  // COMPONENT
  // =========================================================

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  // =========================================================
  // INITIAL STATE
  // =========================================================

  describe('initial state', () => {
    it('should have menu closed', () => {
      expect(component.menuOpen).toBe(false);
    });

    it('should have empty search keyword', () => {
      expect(component.searchKeyword).toBe('');
    });

    it('should have account menu closed', () => {
      expect(component.accountMenuOpen).toBe(false);
    });

    it('should have image search closed', () => {
      expect(component.imageSearchOpen()).toBe(false);
    });

    it('should have no image preview', () => {
      expect(component.imagePreviewUrl()).toBeNull();
    });

    it('should not be loading image search', () => {
      expect(component.imageSearchLoading()).toBe(false);
    });

    it('should have no image search error', () => {
      expect(component.imageSearchError()).toBe('');
    });
  });

  // =========================================================
  // LOGIN STATUS
  // =========================================================

  describe('isLoggedIn', () => {
    it('should return false when token does not exist', () => {
      localStorage.removeItem('token');

      expect(component.isLoggedIn).toBe(false);
    });

    it('should return true when token exists', () => {
      localStorage.setItem('token', 'test-jwt-token');

      expect(component.isLoggedIn).toBe(true);
    });
  });

  // =========================================================
  // ngOnInit
  // =========================================================

  describe('ngOnInit', () => {
    it('should load username and email', () => {
      authServiceMock.getUsername.mockReturnValue('john');

      localStorage.setItem('email', 'john@smartcart.com');

      component.ngOnInit();

      expect(component.username).toBe('john');

      expect(component.email).toBe('john@smartcart.com');

      expect(authServiceMock.getUsername).toHaveBeenCalledTimes(1);
    });

    it('should use empty email when email is not stored', () => {
      localStorage.removeItem('email');

      component.ngOnInit();

      expect(component.email).toBe('');
    });
  });

  // =========================================================
  // ACCOUNT MENU
  // =========================================================

  describe('toggleAccountMenu', () => {
    it('should open account menu', () => {
      localStorage.setItem('email', 'john@smartcart.com');

      authServiceMock.getUsername.mockReturnValue('john');

      component.toggleAccountMenu();

      expect(component.accountMenuOpen).toBe(true);

      expect(component.username).toBe('john');

      expect(component.email).toBe('john@smartcart.com');
    });

    it('should close account menu', () => {
      component.accountMenuOpen = true;

      component.toggleAccountMenu();

      expect(component.accountMenuOpen).toBe(false);
    });
  });

  // =========================================================
  // MENU
  // =========================================================

  describe('menu', () => {
    it('should open menu', () => {
      component.menuOpen = false;

      component.toggleMenu();

      expect(component.menuOpen).toBe(true);
    });

    it('should close menu', () => {
      component.menuOpen = true;

      component.closeMenu();

      expect(component.menuOpen).toBe(false);
    });

    it('should toggle menu twice', () => {
      component.toggleMenu();

      component.toggleMenu();

      expect(component.menuOpen).toBe(false);
    });
  });

  // =========================================================
  // TEXT SEARCH
  // =========================================================

  describe('onSearch', () => {
    it('should not search when keyword is empty', () => {
      component.searchKeyword = '';

      component.onSearch();

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('should not search when keyword contains only spaces', () => {
      component.searchKeyword = '     ';

      component.onSearch();

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('should navigate to search page', () => {
      component.searchKeyword = 'shirt';

      component.onSearch();

      expect(routerMock.navigate).toHaveBeenCalledWith(
        ['/search'],

        {
          queryParams: {
            keyword: 'shirt',
          },
        },
      );
    });

    it('should trim search keyword', () => {
      component.searchKeyword = '   shirt   ';

      component.onSearch();

      expect(routerMock.navigate).toHaveBeenCalledWith(
        ['/search'],

        {
          queryParams: {
            keyword: 'shirt',
          },
        },
      );
    });

    it('should clear search keyword after searching', () => {
      component.searchKeyword = 'shirt';

      component.onSearch();

      expect(component.searchKeyword).toBe('');
    });

    it('should close menu after searching', () => {
      component.menuOpen = true;

      component.searchKeyword = 'shirt';

      component.onSearch();

      expect(component.menuOpen).toBe(false);
    });
  });

  // =========================================================
  // OPEN IMAGE SEARCH
  // =========================================================

  describe('openImageSearch', () => {
    it('should open image search', () => {
      component.openImageSearch();

      expect(component.imageSearchOpen()).toBe(true);
    });

    it('should clear previous error', () => {
      component.imageSearchError.set('Previous error');

      component.openImageSearch();

      expect(component.imageSearchError()).toBe('');
    });

    it('should reset loading state', () => {
      component.imageSearchLoading.set(true);

      component.openImageSearch();

      expect(component.imageSearchLoading()).toBe(false);
    });
  });

  // =========================================================
  // CLOSE IMAGE SEARCH
  // =========================================================

  describe('closeImageSearch', () => {
    it('should close image search', () => {
      component.imageSearchOpen.set(true);

      component.closeImageSearch();

      expect(component.imageSearchOpen()).toBe(false);
    });

    it('should clear image preview', () => {
      component.imagePreviewUrl.set('data:image/jpeg;base64,test');

      component.closeImageSearch();

      expect(component.imagePreviewUrl()).toBeNull();
    });

    it('should clear image search error', () => {
      component.imageSearchError.set('Something went wrong');

      component.closeImageSearch();

      expect(component.imageSearchError()).toBe('');
    });

    it('should reset loading state', () => {
      component.imageSearchLoading.set(true);

      component.closeImageSearch();

      expect(component.imageSearchLoading()).toBe(false);
    });
  });

  // =========================================================
  // IMAGE FILE SELECTION
  // =========================================================

  describe('onImageFileSelected', () => {
    it('should do nothing when no file is selected', () => {
      const input = document.createElement('input');

      input.type = 'file';

      Object.defineProperty(input, 'files', {
        value: [],
      });

      const event = {
        target: input,
      } as unknown as Event;

      component.onImageFileSelected(event);

      expect(component.imageSearchError()).toBe('');
    });

    it('should reject non-image file', () => {
      const file = new File(['test'], 'document.pdf', {
        type: 'application/pdf',
      });

      const input = document.createElement('input');

      input.type = 'file';

      Object.defineProperty(input, 'files', {
        value: [file],
      });

      const event = {
        target: input,
      } as unknown as Event;

      component.onImageFileSelected(event);

      expect(component.imageSearchError()).toBe('Please select a valid image file.');
    });

    it('should accept a valid image file', () => {
      const file = new File(['image-data'], 'shirt.jpg', {
        type: 'image/jpeg',
      });

      const input = document.createElement('input');

      input.type = 'file';

      Object.defineProperty(input, 'files', {
        value: [file],
      });

      const event = {
        target: input,
      } as unknown as Event;

      component.onImageFileSelected(event);

      expect(component.imageSearchError()).toBe('');
    });
  });

  // =========================================================
  // CLEAR IMAGE
  // =========================================================

  describe('clearSelectedImage', () => {
    it('should clear selected image state', () => {
      component.imagePreviewUrl.set('data:image/jpeg;base64,test');

      component.imageSearchError.set('Test error');

      component.clearSelectedImage();

      expect(component.imagePreviewUrl()).toBeNull();

      expect(component.imageSearchError()).toBe('');
    });
  });

  // =========================================================
  // IMAGE SEARCH WITHOUT IMAGE
  // =========================================================

  describe('onImageSearch', () => {
    it('should display error when no image is selected', () => {
      component.onImageSearch();

      expect(component.imageSearchError()).toBe('Please select an image first.');

      expect(component.imageSearchLoading()).toBe(false);

      expect(productServiceMock.detectImageSearchLabel).not.toHaveBeenCalled();
    });

    // =======================================================
    // SUCCESS
    // =======================================================

    it('should search image successfully when products are found', async () => {
      const file = new File(['image-data'], 'shirt.jpg', {
        type: 'image/jpeg',
      });

      /*
       * selectedImageFile is private.
       * Set it here only for unit testing.
       */

      (component as any).selectedImageFile = file;

      const response = {
        prediction: 'man green shirt',

        searchLabel: 'men green shirt',

        gender: 'man',

        color: 'green',

        category: 'shirt',

        products: [
          {
            id: 1,
            name: 'Green Shirt',
          },

          {
            id: 2,
            name: 'Green T-Shirt',
          },
        ],
      };

      productServiceMock.detectImageSearchLabel.mockReturnValue(of(response));

      component.menuOpen = true;

      await component.onImageSearch();

      expect(productServiceMock.detectImageSearchLabel).toHaveBeenCalledTimes(1);

      expect(productServiceMock.detectImageSearchLabel).toHaveBeenCalledWith(file);

      expect(component.imageSearchLoading()).toBe(false);

      expect(component.imageSearchError()).toBe('');

      expect(component.imageSearchOpen()).toBe(false);

      expect(component.imagePreviewUrl()).toBeNull();

      expect(component.menuOpen).toBe(false);

      expect(routerMock.navigate).toHaveBeenCalledWith(
        ['/search'],

        expect.objectContaining({
          state: {
            imageSearchResults: response.products,

            imageSearchPrediction: 'man green shirt',

            imageSearchLabel: 'men green shirt',

            imageSearchGender: 'man',

            imageSearchColor: 'green',

            imageSearchCategory: 'shirt',
          },

          onSameUrlNavigation: 'reload',
        }),
      );
    });

    // =======================================================
    // NO PRODUCTS
    // =======================================================

    it('should display error when no matching products are found', () => {
      const file = new File(['image-data'], 'unknown.jpg', {
        type: 'image/jpeg',
      });

      (component as any).selectedImageFile = file;

      productServiceMock.detectImageSearchLabel.mockReturnValue(
        of({
          prediction: 'unknown',

          searchLabel: 'unknown',

          gender: 'man',

          color: 'green',

          category: 'shirt',

          products: [],
        }),
      );

      component.onImageSearch();

      expect(component.imageSearchLoading()).toBe(false);

      expect(component.imageSearchError()).toBe('No matching products found.');

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    // =======================================================
    // NULL PRODUCTS
    // =======================================================

    it('should display error when products are undefined', () => {
      const file = new File(['image-data'], 'shirt.jpg', {
        type: 'image/jpeg',
      });

      (component as any).selectedImageFile = file;

      productServiceMock.detectImageSearchLabel.mockReturnValue(
        of({
          prediction: 'man green shirt',

          searchLabel: 'man green shirt',

          gender: 'man',

          color: 'green',

          category: 'shirt',

          products: undefined,
        }),
      );

      component.onImageSearch();

      expect(component.imageSearchLoading()).toBe(false);

      expect(component.imageSearchError()).toBe('No matching products found.');
    });

    // =======================================================
    // ERROR
    // =======================================================

    it('should display error when AI service call fails', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      productServiceMock.detectImageSearchLabel.mockReturnValue(
        throwError(() => new Error('boom')),
      );

      // Select an image first so onImageSearch()
      // reaches the ProductService call.
      const file = new File(['test image'], 'test.jpg', {
        type: 'image/jpeg',
      });

      component['selectedImageFile'] = file;

      component.onImageSearch();

      expect(component.imageSearchError()).toBe('Image search failed. Please try again.');

      expect(component.imageSearchLoading()).toBe(false);

      expect(productServiceMock.detectImageSearchLabel).toHaveBeenCalledWith(file);
    });
  });

  // =========================================================
  // LOGIN
  // =========================================================

  describe('goToLogin', () => {
    it('should navigate to login page', () => {
      component.accountMenuOpen = true;

      component.goToLogin();

      expect(component.accountMenuOpen).toBe(false);

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  // =========================================================
  // LOGOUT
  // =========================================================

  describe('logout', () => {
    it('should call AuthService logout', () => {
      component.logout();

      expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
    });

    it('should navigate to login after logout', () => {
      component.logout();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should close menu after logout', () => {
      component.menuOpen = true;

      component.logout();

      expect(component.menuOpen).toBe(false);
    });
  });
});
