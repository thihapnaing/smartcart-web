// This file tests the real ProductService, not a stand-in for it. Every other
// spec file so far has replaced ProductService with a fake object, which is
// correct for testing components in isolation, but it also means the actual
// code inside product.ts — the part that builds each web address and reads
// each server reply — was never run by any test. This file runs it directly.
//
// Since ProductService makes real HTTP calls, HttpTestingController stands
// in for the network: it lets a test say "expect one request to this
// address" and hand back a made-up reply with req.flush(...), without a
// real server ever being involved.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ProductService } from './product';
import { environment } from '../../environments/environment';
import { ProductSearchResult } from '../models/product-search-result';
import { ProductDetailResponse } from '../models/product-detail-response';
import { ImageSearchLabel } from '../models/image-search-label';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  // Rebuilt from the same environment value product.ts itself reads, so this
  // file does not need to guess or hard-code the real API address.
  const apiBase = `${environment.apiUrl}/products`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // Confirms that every request a test expected was actually sent, and that
  // no extra, unexpected request slipped through unnoticed.
  afterEach(() => {
    httpMock.verify();
  });

  describe('browse', () => {
    it('calls the browse endpoint with no filters when none are given', () => {
      const sampleResults: ProductSearchResult[] = [];

      service.browse().subscribe(result => {
        expect(result).toEqual(sampleResults);
      });

      // req.url is the address only; query filters live separately on
      // req.params, which is why both are checked here.
      const req = httpMock.expectOne(
        request => request.url === `${apiBase}/browse` && request.params.keys().length === 0
      );
      expect(req.request.method).toBe('GET');
      req.flush(sampleResults);
    });

    it('sends keyword, category, gender, newestFirst, and limit as query filters when given', () => {
      service
        .browse({
          keyword: 'shoes',
          category: 'Shoes',
          gender: 'WOMEN',
          newestFirst: true,
          limit: 5,
        })
        .subscribe();

      const req = httpMock.expectOne(request => request.url === `${apiBase}/browse`);
      expect(req.request.params.get('keyword')).toBe('shoes');
      expect(req.request.params.get('category')).toBe('Shoes');
      expect(req.request.params.get('gender')).toBe('WOMEN');
      expect(req.request.params.get('newestFirst')).toBe('true');
      expect(req.request.params.get('limit')).toBe('5');
      req.flush([]);
    });

    it('leaves out any filter that was not given', () => {
      service.browse({ keyword: 'shoes' }).subscribe();

      const req = httpMock.expectOne(request => request.url === `${apiBase}/browse`);
      expect(req.request.params.get('keyword')).toBe('shoes');
      expect(req.request.params.has('category')).toBe(false);
      expect(req.request.params.has('gender')).toBe(false);
      expect(req.request.params.has('newestFirst')).toBe(false);
      expect(req.request.params.has('limit')).toBe(false);
      req.flush([]);
    });

    it('still sends newestFirst when it is explicitly set to false', () => {
      // The code checks "!== undefined" rather than a plain truthy check, so
      // an explicit false must still be sent rather than treated as omitted.
      service.browse({ newestFirst: false }).subscribe();

      const req = httpMock.expectOne(request => request.url === `${apiBase}/browse`);
      expect(req.request.params.get('newestFirst')).toBe('false');
      req.flush([]);
    });
  });

  describe('searchProducts', () => {
    it('calls the search endpoint with the keyword as a query filter', () => {
      const sampleResults: ProductSearchResult[] = [];

      service.searchProducts('shoes').subscribe(result => {
        expect(result).toEqual(sampleResults);
      });

      const req = httpMock.expectOne(
        request => request.url === `${apiBase}/search` && request.params.get('keyword') === 'shoes'
      );
      expect(req.request.method).toBe('GET');
      req.flush(sampleResults);
    });
  });

  describe('getProductById', () => {
    it('calls the product endpoint for the given id', () => {
      const sampleProduct = {} as ProductDetailResponse;

      service.getProductById(42).subscribe(result => {
        expect(result).toEqual(sampleProduct);
      });

      const req = httpMock.expectOne(`${apiBase}/42`);
      expect(req.request.method).toBe('GET');
      req.flush(sampleProduct);
    });
  });

  describe('detectImageSearchLabel', () => {
    it('sends the file as form data to the image search endpoint', () => {
      const file = new File(['fake-image-bytes'], 'shoe.jpg', { type: 'image/jpeg' });
      const sampleLabel = {} as ImageSearchLabel;

      service.detectImageSearchLabel(file).subscribe(result => {
        expect(result).toEqual(sampleLabel);
      });

      const req = httpMock.expectOne(`${apiBase}/search/image`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      expect((req.request.body as FormData).get('image')).toBe(file);
      req.flush(sampleLabel);
    });
  });
});
