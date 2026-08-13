import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminProductService } from './admin-product';
import { environment } from '../../../environments/environment';
import { AdminProductSummary } from '../models/admin-product-summary';

describe('AdminProductService', () => {
  let service: AdminProductService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(AdminProductService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('getAllProducts() sends a GET to /admin/products and returns the response', () => {
    const fakeProducts: AdminProductSummary[] = [];
    let actualProducts: AdminProductSummary[] | undefined;

    service.getAllProducts().subscribe((products) => {
      actualProducts = products;
    });

    const request = httpTestingController.expectOne(`${environment.apiUrl}/admin/products`);
    expect(request.request.method).toBe('GET');

    request.flush(fakeProducts);

    expect(actualProducts).toEqual(fakeProducts);
  });

  it('updateStatus() sends a PATCH with the new status to /admin/products/:id/status', () => {
    const fakeProduct = {} as AdminProductSummary;
    let actualProduct: AdminProductSummary | undefined;

    service.updateStatus(7, 'INACTIVE').subscribe((product) => {
      actualProduct = product;
    });

    const request = httpTestingController.expectOne(`${environment.apiUrl}/admin/products/7/status`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'INACTIVE' });

    request.flush(fakeProduct);

    expect(actualProduct).toEqual(fakeProduct);
  });
});
