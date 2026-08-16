import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { MerchantProductService } from './merchant-product-service';
import { ProductRequest } from '../models/product-request';
import { ProductDetailResponse } from '../models/product-detail-response';
import { ProductSearchResult } from '../models/product-search-result';
import { ImageUploadResponse } from '../models/image-upload-response';
import { environment } from '../../environments/environment';

describe('MerchantProductService', () => {
  let service: MerchantProductService;
  let httpMock: HttpTestingController;

  const apiBase = `${environment.apiUrl}/products`;

  const productResponse = {
    productId: 1,
    name: 'Blue T-Shirt',
    description: 'A blue cotton T-shirt',
    price: 20,
    imageUrl: 'shirt.jpg',
    gender: 'MEN',
    categoryName: 'Tops',
    shopName: 'SmartCart Shop',
    status: 'ACTIVE',
    color: 'Blue',
    variants: []
  } as ProductDetailResponse;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MerchantProductService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(MerchantProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should get my products', () => {
    const products = [] as ProductSearchResult[];

    service.getMyProducts().subscribe(result => {
      expect(result).toEqual(products);
    });

    const req = httpMock.expectOne(`${apiBase}/own`);

    expect(req.request.method).toBe('GET');

    req.flush(products);
  });

  it('should get product detail', () => {
    service.getProductDetail(1).subscribe(result => {
      expect(result).toEqual(productResponse);
    });

    const req = httpMock.expectOne(`${apiBase}/1`);

    expect(req.request.method).toBe('GET');

    req.flush(productResponse);
  });

  it('should create a product', () => {
    const request = {
      name: 'Blue T-Shirt',
      description: 'A blue cotton T-shirt',
      price: 20,
      gender: 'MEN',
      categoryId: 1,
      status: 'ACTIVE',
      imageUrl: 'shirt.jpg',
      color: 'Blue',
      variants: [
        {
          size: 'M',
          stock: 10
        }
      ]
    } as ProductRequest;

    service.createProduct(request).subscribe(result => {
      expect(result).toEqual(productResponse);
    });

    const req = httpMock.expectOne(apiBase);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);

    req.flush(productResponse);
  });

  it('should update a product', () => {
    const request = {
      name: 'Updated T-Shirt',
      description: 'Updated description',
      price: 25,
      gender: 'MEN',
      categoryId: 1,
      status: 'ACTIVE',
      imageUrl: 'shirt.jpg',
      color: 'Blue',
      variants: [
        {
          size: 'L',
          stock: 15
        }
      ]
    } as ProductRequest;

    service.updateProduct(1, request).subscribe(result => {
      expect(result).toEqual(productResponse);
    });

    const req = httpMock.expectOne(`${apiBase}/1`);

    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);

    req.flush(productResponse);
  });

  it('should activate a product', () => {
    service.activateProduct(1).subscribe(result => {
      expect(result).toEqual(productResponse);
    });

    const req = httpMock.expectOne(`${apiBase}/1/activate`);

    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});

    req.flush(productResponse);
  });

  it('should deactivate a product', () => {
    service.deactivateProduct(1).subscribe(result => {
      expect(result).toEqual(productResponse);
    });

    const req = httpMock.expectOne(`${apiBase}/1`);

    expect(req.request.method).toBe('DELETE');

    req.flush(productResponse);
  });

  it('should upload an image', () => {
    const file = new File(
      ['fake image content'],
      'shirt.jpg',
      { type: 'image/jpeg' }
    );

    const response = {} as ImageUploadResponse;

    service.uploadImage(file).subscribe(result => {
      expect(result).toEqual(response);
    });

    const req = httpMock.expectOne(`${apiBase}/image-upload`);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeInstanceOf(FormData);

    const formData = req.request.body as FormData;

    expect(formData.get('file')).toBe(file);

    req.flush(response);
  });
});