import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ProductsList } from './products-list';
import { MerchantProductService } from '../../../../services/merchant-product-service';

describe('ProductsList', () => {
  let component: ProductsList;
  let fixture: ComponentFixture<ProductsList>;

  let productServiceMock: {
    getMyProducts: ReturnType<typeof vi.fn>;
    activateProduct: ReturnType<typeof vi.fn>;
    deactivateProduct: ReturnType<typeof vi.fn>;
  };

  const products = [
    {
      id: 1,
      name: 'Blue T-Shirt',
      categoryName: 'Tops',
      price: 20,
      status: 'ACTIVE',
      gender: 'MEN',
      imageUrl: 'shirt.jpg'
    },
    {
      id: 2,
      name: 'Black Dress',
      categoryName: 'Tops',
      price: 40,
      status: 'INACTIVE',
      gender: 'WOMEN',
      imageUrl: 'dress.jpg'
    },
    {
      id: 3,
      name: 'Running Shoes',
      categoryName: 'Shoes',
      price: 80,
      status: 'ACTIVE',
      gender: 'WOMEN',
      imageUrl: 'shoes.jpg'
    }
  ];

  beforeEach(async () => {
    productServiceMock = {
      getMyProducts: vi.fn().mockReturnValue(of([])),
      activateProduct: vi.fn().mockReturnValue(of(void 0)),
      deactivateProduct: vi.fn().mockReturnValue(of(void 0))
    };

    await TestBed.configureTestingModule({
      imports: [ProductsList],
      providers: [
        provideRouter([]),
        {
          provide: MerchantProductService,
          useValue: productServiceMock
        }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(ProductsList);
    component = fixture.componentInstance;

    expect(component).toBeTruthy();
  });

  it('should load products on initialization', () => {
    fixture = TestBed.createComponent(ProductsList);
    component = fixture.componentInstance;

    fixture.detectChanges();

    expect(productServiceMock.getMyProducts).toHaveBeenCalledTimes(1);
  });

  it('should show all products by default', () => {
    productServiceMock.getMyProducts.mockReturnValue(of(products));

    fixture = TestBed.createComponent(ProductsList);
    component = fixture.componentInstance;

    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll(
      '.product-table tbody tr'
    );

    expect(rows.length).toBe(3);
  });

  it('should show only active products when Active tab is selected', () => {
    productServiceMock.getMyProducts.mockReturnValue(of(products));

    fixture = TestBed.createComponent(ProductsList);
    component = fixture.componentInstance;

    fixture.detectChanges();

    const tabs = fixture.nativeElement.querySelectorAll('.tab-btn');

    // All = 0, Active = 1, Inactive = 2
    tabs[1].click();

    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll(
      '.product-table tbody tr'
    );

    expect(rows.length).toBe(2);
  });

  it('should show only inactive products when Inactive tab is selected', () => {
    productServiceMock.getMyProducts.mockReturnValue(of(products));

    fixture = TestBed.createComponent(ProductsList);
    component = fixture.componentInstance;

    fixture.detectChanges();

    const tabs = fixture.nativeElement.querySelectorAll('.tab-btn');

    tabs[2].click();

    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll(
      '.product-table tbody tr'
    );

    expect(rows.length).toBe(1);
  });

  it('should display empty state when there are no products', () => {
    fixture = TestBed.createComponent(ProductsList);
    component = fixture.componentInstance;

    fixture.detectChanges();

    const emptyState =
      fixture.nativeElement.querySelector('.empty-state');

    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('No products found.');
  });

  it('should filter products by search keyword', () => {
    productServiceMock.getMyProducts.mockReturnValue(of(products));

    fixture = TestBed.createComponent(ProductsList);
    component = fixture.componentInstance;

    fixture.detectChanges();

    const searchInput =
      fixture.nativeElement.querySelector('#product-search');

    searchInput.value = 'shirt';
    searchInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll(
      '.product-table tbody tr'
    );

    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Blue T-Shirt');
  });

  it('should trim the search keyword', () => {
    productServiceMock.getMyProducts.mockReturnValue(of(products));

    fixture = TestBed.createComponent(ProductsList);
    component = fixture.componentInstance;

    fixture.detectChanges();

    const searchInput =
      fixture.nativeElement.querySelector('#product-search');

    searchInput.value = '  shirt  ';
    searchInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll(
      '.product-table tbody tr'
    );

    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Blue T-Shirt');
  });

  it('should filter products by category', () => {
    productServiceMock.getMyProducts.mockReturnValue(of(products));

    fixture = TestBed.createComponent(ProductsList);
    component = fixture.componentInstance;

    fixture.detectChanges();

    const categorySelect =
      fixture.nativeElement.querySelector('#category-filter');

    categorySelect.value = 'Shoes';
    categorySelect.dispatchEvent(new Event('change'));

    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll(
      '.product-table tbody tr'
    );

    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Running Shoes');
  });

  it('should filter products by gender', () => {
    productServiceMock.getMyProducts.mockReturnValue(of(products));

    fixture = TestBed.createComponent(ProductsList);
    component = fixture.componentInstance;

    fixture.detectChanges();

    const genderSelect =
      fixture.nativeElement.querySelector('#gender-filter');

    genderSelect.value = 'MEN';
    genderSelect.dispatchEvent(new Event('change'));

    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll(
      '.product-table tbody tr'
    );

    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Blue T-Shirt');
  });

  it('should deactivate an active product', () => {
    productServiceMock.getMyProducts.mockReturnValue(of(products));

    fixture = TestBed.createComponent(ProductsList);
    component = fixture.componentInstance;

    fixture.detectChanges();

    const deactivateButton =
      fixture.nativeElement.querySelector('[title="Deactivate"]');

    expect(deactivateButton).toBeTruthy();

    deactivateButton.click();

    expect(productServiceMock.deactivateProduct)
      .toHaveBeenCalledWith(1);

    expect(productServiceMock.getMyProducts)
      .toHaveBeenCalledTimes(2);
  });

  it('should activate an inactive product', () => {
    productServiceMock.getMyProducts.mockReturnValue(of(products));

    fixture = TestBed.createComponent(ProductsList);
    component = fixture.componentInstance;

    fixture.detectChanges();

    const activateButton =
      fixture.nativeElement.querySelector('[title="Activate"]');

    expect(activateButton).toBeTruthy();

    activateButton.click();

    expect(productServiceMock.activateProduct)
      .toHaveBeenCalledWith(2);

    expect(productServiceMock.getMyProducts)
      .toHaveBeenCalledTimes(2);
  });
});