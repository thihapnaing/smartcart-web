import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CategoryService } from './category-service';
import { CategoryResponse } from '../models/category-response';
import { environment } from '../../environments/environment';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    // Set up a fresh testing version of Angular's dependency injection system.
    // provideHttpClient() registers a normal-looking HttpClient for the service to receive.
    // provideHttpClientTesting() swaps out the part that would send real network
    // requests with a fake, controllable version instead.
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Make sure no request was expected but never accounted for in a test.
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch categories from the categories endpoint', () => {
    // Stand-in data, playing the role of what a real backend would send back.
    const mockCategories: CategoryResponse[] = [
      { id: 1, name: 'Tops' },
      { id: 2, name: 'Bottoms' }
    ];

    // Call the method under test. No network request goes out yet — the fake
    // HTTP layer holds onto it until the test decides how to respond below.
    service.getCategories().subscribe((categories) => {
      // Confirm the service handed back exactly the fake data provided.
      expect(categories).toEqual(mockCategories);
    });

    // Find the one pending request and confirm it went to the expected address.
    const req = httpMock.expectOne(`${environment.apiUrl}/categories`);

    // Confirm the request was sent as a GET, the same way a browser would.
    expect(req.request.method).toBe('GET');

    // Supply the fake response body — this is what triggers the subscribe callback above.
    req.flush(mockCategories);
  });
});