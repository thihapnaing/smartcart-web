import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { DeliveryList } from './delivery-list';

describe('DeliveryList', () => {
  let component: DeliveryList;
  let fixture: ComponentFixture<DeliveryList>;
  let httpMock: HttpTestingController;

  const sampleOrders = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Tan',
      status: 'PACKED',
      trackingNo: 'TRK001',
      deliveryPersonId: 1,
      deliveryPersonName: 'Rider One',
      deliveredAt: null,
      deliveryProofKey: null,
      saving: false,
    },
    {
      id: 2,
      firstName: 'Mary',
      lastName: 'Lim',
      status: 'DELIVERED',
      trackingNo: 'TRK002',
      deliveryPersonId: 2,
      deliveryPersonName: 'Rider Two',
      deliveredAt: '2026-08-15T10:00:00',
      deliveryProofKey: 'proof/order2.jpg',
      saving: false,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryList],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeliveryList);
    component = fixture.componentInstance;

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should identify a delivered order', () => {
    const order = sampleOrders[1] as any;

    expect(component.isDelivered(order)).toBe(true);
  });

  it('should identify a non-delivered order', () => {
    const order = sampleOrders[0] as any;

    expect(component.isDelivered(order)).toBe(false);
  });

  it('should load delivery orders', () => {
    component.loadOrders();

    const request = httpMock.expectOne('/api/orders/orders');

    expect(request.request.method).toBe('GET');

    request.flush(sampleOrders);

    expect(component.orders.length).toBe(2);
    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBe('');
  });

  it('should handle error when loading delivery orders', () => {
    component.loadOrders();

    const request = httpMock.expectOne('/api/orders/orders');

    request.flush(
      {},
      {
        status: 500,
        statusText: 'Internal Server Error',
      },
    );

    expect(component.orders.length).toBe(0);
    expect(component.loading).toBe(false);
    expect(component.errorMessage).toContain(
      'Unable to load delivery records',
    );
  });

  it('should load delivery personnel', () => {
    const people = [
      {
        id: 1,
        name: 'Delivery Man One',
      },
      {
        id: 2,
        name: 'Delivery Man Two',
      },
    ];

    component.loadDeliveryPersonel();

    const request = httpMock.expectOne(
      '/api/orders/delivery-men',
    );

    expect(request.request.method).toBe('GET');

    request.flush(people);

    expect(component.deliveryPersonel.length).toBe(2);
    expect(component.deliveryPersonel[0].name)
      .toBe('Delivery Man One');
  });

  it('should return all orders when no status is selected', () => {
    component.orders = sampleOrders as any;
    component.selectedStatus = '';

    const result = component.filteredOrders;

    expect(result.length).toBe(2);
  });

  it('should filter orders by selected status', () => {
    component.orders = sampleOrders as any;
    component.selectedStatus = 'DELIVERED';

    const result = component.filteredOrders;

    expect(result.length).toBe(1);
    expect(result[0].status).toBe('DELIVERED');
  });

  it('should format status correctly', () => {
    expect(component.formatStatus('PICKED_UP'))
      .toBe('Picked Up');

    expect(component.formatStatus('DELIVERED'))
      .toBe('Delivered');
  });

  it('should save delivery details', () => {
    const order = {
      ...sampleOrders[0],
      status: 'PICKED_UP',
      trackingNo: ' TRK001 ',
    } as any;

    component.saveDelivery(order);

    const request = httpMock.expectOne(
      '/api/orders/1/delivery-details',
    );

    expect(request.request.method).toBe('PATCH');

    expect(request.request.body).toEqual({
      status: 'PICKED_UP',
      trackingNo: 'TRK001',
      deliveryPersonId: 1,
    });

    request.flush({
      ...order,
      status: 'PICKED_UP',
      trackingNo: 'TRK001',
    });

    expect(order.saving).toBe(false);

    expect(component.successMessage)
      .toContain('Order 1 updated successfully');
  });

  it('should handle duplicate tracking number', () => {
    const order = {
      ...sampleOrders[0],
    } as any;

    component.saveDelivery(order);

    const request = httpMock.expectOne(
      '/api/orders/1/delivery-details',
    );

    request.flush(
      {},
      {
        status: 409,
        statusText: 'Conflict',
      },
    );

    expect(order.saving).toBe(false);

    expect(component.errorMessage)
      .toBe('The tracking number is already in use.');
  });

  it('should handle general error when saving delivery', () => {
    const order = {
      ...sampleOrders[0],
    } as any;

    component.saveDelivery(order);

    const request = httpMock.expectOne(
      '/api/orders/1/delivery-details',
    );

    request.flush(
      {},
      {
        status: 500,
        statusText: 'Internal Server Error',
      },
    );

    expect(order.saving).toBe(false);

    expect(component.errorMessage)
      .toBe('Unable to update order 1.');
  });

  it('should not save an already delivered order', () => {
    const order = {
      ...sampleOrders[1],
    } as any;

    component.saveDelivery(order);

    httpMock.expectNone(
      '/api/orders/2/delivery-details',
    );
  });

  it('should show error when delivery proof does not exist', () => {
    const order = {
      ...sampleOrders[0],
      deliveryProofKey: null,
    } as any;

    component.viewProof(order);

    expect(component.errorMessage)
      .toBe('No delivery proof available.');
  });
});