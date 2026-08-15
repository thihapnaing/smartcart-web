import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { ProductForm } from './product-form';
import { MerchantProductService } from '../../../../services/merchant-product-service';
import { CategoryService } from '../../../../services/category-service';

describe('ProductForm', () => {
  let component: ProductForm;
  let fixture: ComponentFixture<ProductForm>;

  let productServiceMock: any;
  let categoryServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    productServiceMock = {
      uploadImage: vi.fn(),
      getProductDetail: vi.fn(),
      createProduct: vi.fn(),
      updateProduct: vi.fn()
    };

    categoryServiceMock = {
      getCategories: vi.fn().mockReturnValue(of([]))
    };

    routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ProductForm],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: vi.fn().mockReturnValue(null)
              }
            }
          }
        },
        {
          provide: Router,
          useValue: routerMock
        },
        {
          provide: MerchantProductService,
          useValue: productServiceMock
        },
        {
          provide: CategoryService,
          useValue: categoryServiceMock
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize create mode when there is no product id', () => {
  fixture.detectChanges();

  expect(productServiceMock.getProductDetail).not.toHaveBeenCalled();
  });
});