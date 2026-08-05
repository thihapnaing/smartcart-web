import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product';
import { environment } from '../../environments/environment';
import { ProductSearchResult } from '../models/product-search-result';
import { ProductDetailResponse } from '../models/product-detail-response';

describe('ProductService', () => {
  let productService: ProductService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    // Build a fresh, isolated Angular test environment before each test runs,
    // so tests never leak state into one another.
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    // Request a real, working instance of ProductService from the test environment.
    productService = TestBed.inject(ProductService);

    // Request the fake network controller that stands in for a real server.
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Fail the test loudly if a request was made but never checked or answered,
    // since an unchecked request usually means a bug.
    httpTestingController.verify();
  });

  it('should send a GET request to the search endpoint with the keyword and return the results', () => {
    // A minimal stand-in for what the real server would send back.
    const fakeSearchResults: ProductSearchResult[] = [];

    let actualResults: ProductSearchResult[] | undefined;

    // Call the real method under test. Nothing happens over the network yet;
    // subscribing is what triggers the request.
    productService.searchProducts('shirt').subscribe(results => {
      actualResults = results;
    });

    // Look for the one outgoing request whose base address matches the search endpoint.
    const request = httpTestingController.expectOne(
      outgoingRequest => outgoingRequest.url === `${environment.apiUrl}/products/search`
    );

    // A search should read data, not change it, so the method must be GET.
    expect(request.request.method).toBe('GET');

    // Confirm the search word was attached as a query parameter, not lost along the way.
    expect(request.request.params.get('keyword')).toBe('shirt');

    // Manually deliver the fake response, playing the role of the real server.
    request.flush(fakeSearchResults);

    // Confirm the service handed back exactly what the fake server sent.
    expect(actualResults).toEqual(fakeSearchResults);
  });

  it('should send a GET request to the correct product-by-id endpoint', () => {
    // Cast an empty object to the expected shape; the exact fields do not matter
    // for this test, only that the same object comes back out.
    const fakeProduct = {} as ProductDetailResponse;

    let actualProduct: ProductDetailResponse | undefined;

    productService.getProductById(42).subscribe(product => {
      actualProduct = product;
    });

    const request = httpTestingController.expectOne(`${environment.apiUrl}/products/42`);

    expect(request.request.method).toBe('GET');

    request.flush(fakeProduct);

    expect(actualProduct).toEqual(fakeProduct);
  });
});