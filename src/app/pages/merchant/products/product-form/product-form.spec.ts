import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ProductForm } from './product-form';
import { MerchantProductService } from '../../../../services/merchant-product-service';
import { CategoryService } from '../../../../services/category-service';

describe('ProductForm', () => {
  let component: ProductForm;
  let fixture: ComponentFixture<ProductForm>;

  let productServiceMock: {
    uploadImage: ReturnType<typeof vi.fn>;
    getProductDetail: ReturnType<typeof vi.fn>;
    createProduct: ReturnType<typeof vi.fn>;
    updateProduct: ReturnType<typeof vi.fn>;
  };

  let categoryServiceMock: {
    getCategories: ReturnType<typeof vi.fn>;
  };

  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };

  let routeMock: {
    snapshot: {
      paramMap: {
        get: ReturnType<typeof vi.fn>;
      };
    };
  };

  const categories = [
    {
      id: 1,
      name: 'Tops'
    },
    {
      id: 2,
      name: 'Shoes'
    }
  ];

  const existingProduct = {
    id: 10,
    name: 'Blue T-Shirt',
    description: 'A blue shirt',
    price: 25,
    gender: 'MEN',
    categoryName: 'Tops',
    status: 'ACTIVE',
    imageUrl: 'shirt.jpg',
    color: 'Blue',
    variants: [
      {
        size: 'M',
        stock: 10
      },
      {
        size: 'L',
        stock: 5
      }
    ]
  };

  beforeEach(async () => {
    productServiceMock = {
      uploadImage: vi.fn(),
      getProductDetail: vi.fn(),
      createProduct: vi.fn(),
      updateProduct: vi.fn()
    };

    categoryServiceMock = {
      getCategories: vi.fn().mockReturnValue(of(categories))
    };

    routerMock = {
      navigate: vi.fn()
    };

    routeMock = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue(null)
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [ProductForm],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: routeMock
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
  });

  it('should create', () => {
    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;

    expect(component).toBeTruthy();
  });

  it('should initialize create mode when there is no product id', () => {
    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;

    fixture.detectChanges();

    expect(productServiceMock.getProductDetail).not.toHaveBeenCalled();
    expect(component['isEditMode']()).toBe(false);
    expect(component['variants'].length).toBe(1);
  });

  it('should load existing product in edit mode', () => {
    routeMock.snapshot.paramMap.get.mockReturnValue('10');
    productServiceMock.getProductDetail.mockReturnValue(
      of(existingProduct)
    );

    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component['productId']()).toBe(10);
    expect(component['isEditMode']()).toBe(true);

    expect(component['form'].value.name).toBe('Blue T-Shirt');
    expect(component['form'].value.description).toBe('A blue shirt');
    expect(component['form'].value.price).toBe(25);
    expect(component['form'].value.gender).toBe('MEN');
    expect(component['form'].value.categoryId).toBe(1);
    expect(component['form'].value.status).toBe('ACTIVE');
    expect(component['form'].value.imageUrl).toBe('shirt.jpg');
    expect(component['form'].value.color).toBe('Blue');

    expect(component['variants'].length).toBe(2);
    expect(component['variants'].at(0).value).toEqual({
      size: 'M',
      stock: 10
    });
    expect(component['variants'].at(1).value).toEqual({
      size: 'L',
      stock: 5
    });
  });

  it('should set categoryId to null when existing product category does not match', () => {
    routeMock.snapshot.paramMap.get.mockReturnValue('10');

    const productWithoutMatchingCategory = {
      ...existingProduct,
      categoryName: 'Unknown Category'
    };

    productServiceMock.getProductDetail.mockReturnValue(
      of(productWithoutMatchingCategory)
    );

    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component['form'].value.categoryId).toBeNull();
  });

  it('should add a variant', () => {
    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;

    fixture.detectChanges();

    const initialLength = component['variants'].length;

    component['addVariant']();

    expect(component['variants'].length).toBe(initialLength + 1);
  });

  it('should remove a variant', () => {
    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;

    fixture.detectChanges();

    component['addVariant']();

    const lengthBeforeRemove = component['variants'].length;

    component['removeVariant'](0);

    expect(component['variants'].length).toBe(lengthBeforeRemove - 1);
  });

  it('should ignore image selection when no file is selected', () => {
    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;

    fixture.detectChanges();

    const event = {
      target: {
        files: []
      }
    } as unknown as Event;

    component['onImageSelected'](event);

    expect(productServiceMock.uploadImage).not.toHaveBeenCalled();
    expect(component['isUploading']()).toBe(false);
  });

  it('should upload image successfully', () => {
    productServiceMock.uploadImage.mockReturnValue(
      of({
        imageUrl: 'uploaded-image.jpg'
      })
    );

    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;

    fixture.detectChanges();

    const file = new File(['image'], 'shirt.jpg', {
      type: 'image/jpeg'
    });

    const event = {
      target: {
        files: [file]
      }
    } as unknown as Event;

    component['onImageSelected'](event);

    expect(productServiceMock.uploadImage).toHaveBeenCalledWith(file);
    expect(component['form'].value.imageUrl).toBe('uploaded-image.jpg');
    expect(component['isUploading']()).toBe(false);
    expect(component['uploadError']()).toBeNull();
  });

  it('should handle image upload error with server message', () => {
    productServiceMock.uploadImage.mockReturnValue(
      throwError(() => ({
        error: {
          message: 'File too large'
        }
      }))
    );

    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;

    fixture.detectChanges();

    const file = new File(['image'], 'shirt.jpg', {
      type: 'image/jpeg'
    });

    const event = {
      target: {
        files: [file]
      }
    } as unknown as Event;

    component['onImageSelected'](event);

    expect(component['uploadError']()).toBe('File too large');
    expect(component['isUploading']()).toBe(false);
  });

  it('should use default image upload error message', () => {
    productServiceMock.uploadImage.mockReturnValue(
      throwError(() => ({
        error: {}
      }))
    );

    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;

    fixture.detectChanges();

    const file = new File(['image'], 'shirt.jpg', {
      type: 'image/jpeg'
    });

    const event = {
      target: {
        files: [file]
      }
    } as unknown as Event;

    component['onImageSelected'](event);

    expect(component['uploadError']()).toBe(
      'Image upload failed. Please try again.'
    );
  });

  it('should not submit when form is invalid', () => {
    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;

    fixture.detectChanges();

    component['onSubmit']();

    expect(productServiceMock.createProduct).not.toHaveBeenCalled();
    expect(productServiceMock.updateProduct).not.toHaveBeenCalled();
  });

  it('should create a product successfully', () => {
    productServiceMock.createProduct.mockReturnValue(of({}));

    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;

    fixture.detectChanges();

    component['form'].patchValue({
      name: 'Blue T-Shirt',
      description: 'A blue shirt',
      price: 25,
      gender: 'MEN',
      categoryId: 1,
      status: 'ACTIVE',
      imageUrl: 'shirt.jpg',
      color: 'Blue'
    });

    component['variants'].clear();
    component['addVariant']();

    component['variants'].at(0).patchValue({
      size: 'M',
      stock: 10
    });

    component['onSubmit']();

    expect(productServiceMock.createProduct).toHaveBeenCalledTimes(1);
    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/merchant/products'
    ]);
  });

  it('should handle create product error with server message', () => {
    productServiceMock.createProduct.mockReturnValue(
      throwError(() => ({
        error: {
          message: 'Product already exists'
        }
      }))
    );

    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;

    fixture.detectChanges();

    component['form'].patchValue({
      name: 'Blue T-Shirt',
      price: 25,
      gender: 'MEN',
      categoryId: 1,
      status: 'ACTIVE'
    });

    component['variants'].clear();
    component['addVariant']();

    component['variants'].at(0).patchValue({
      size: 'M',
      stock: 10
    });

    component['onSubmit']();

    expect(component['uploadError']()).toBe('Product already exists');
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should use default create error message', () => {
    productServiceMock.createProduct.mockReturnValue(
      throwError(() => ({
        error: {}
      }))
    );

    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;

    fixture.detectChanges();

    component['form'].patchValue({
      name: 'Blue T-Shirt',
      price: 25,
      gender: 'MEN',
      categoryId: 1,
      status: 'ACTIVE'
    });

    component['variants'].clear();
    component['addVariant']();

    component['variants'].at(0).patchValue({
      size: 'M',
      stock: 10
    });

    component['onSubmit']();

    expect(component['uploadError']()).toBe(
      'Failed to create product.'
    );
  });

  it('should update a product successfully', () => {
    routeMock.snapshot.paramMap.get.mockReturnValue('10');
    productServiceMock.getProductDetail.mockReturnValue(
      of(existingProduct)
    );
    productServiceMock.updateProduct.mockReturnValue(of({}));

    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;

    fixture.detectChanges();

    component['onSubmit']();

    expect(productServiceMock.updateProduct).toHaveBeenCalledTimes(1);
    expect(productServiceMock.updateProduct).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        name: 'Blue T-Shirt',
        price: 25,
        categoryId: 1
      })
    );

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/merchant/products'
    ]);
  });

  it('should handle update product error with server message', () => {
    routeMock.snapshot.paramMap.get.mockReturnValue('10');

    productServiceMock.getProductDetail.mockReturnValue(
      of(existingProduct)
    );

    productServiceMock.updateProduct.mockReturnValue(
      throwError(() => ({
        error: {
          message: 'Update failed'
        }
      }))
    );

    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;

    fixture.detectChanges();

    component['onSubmit']();

    expect(component['uploadError']()).toBe('Update failed');
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should use default update error message', () => {
    routeMock.snapshot.paramMap.get.mockReturnValue('10');

    productServiceMock.getProductDetail.mockReturnValue(
      of(existingProduct)
    );

    productServiceMock.updateProduct.mockReturnValue(
      throwError(() => ({
        error: {}
      }))
    );

    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;

    fixture.detectChanges();

    component['onSubmit']();

    expect(component['uploadError']()).toBe(
      'Failed to update product.'
    );
  });
});