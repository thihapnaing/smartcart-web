import { TestBed } from '@angular/core/testing';

import { MerchantProductService } from './merchant-product-service';

describe('MerchantProductService', () => {
  let service: MerchantProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MerchantProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
