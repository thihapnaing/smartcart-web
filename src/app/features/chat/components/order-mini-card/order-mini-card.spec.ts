import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderMiniCard } from './order-mini-card';
import { OrderSummary } from '../../models/chat.model';

describe('OrderMiniCard', () => {
  let fixture: ComponentFixture<OrderMiniCard>;
  let component: OrderMiniCard;

  const baseOrder: OrderSummary = {
    orderId: 101,
    totalAmount: 45.5,
    status: 'DELIVERED',
    orderDate: '2026-08-01',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderMiniCard],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderMiniCard);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.order = baseOrder;
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  describe('statusLabel', () => {
    it('returns an empty string when status is missing', () => {
      component.order = { ...baseOrder, status: '' };

      expect(component.statusLabel).toBe('');
    });

    it('capitalizes only the first letter of the status', () => {
      component.order = { ...baseOrder, status: 'DELIVERED' };

      expect(component.statusLabel).toBe('Delivered');
    });

    it('handles already-mixed-case status values the same way', () => {
      component.order = { ...baseOrder, status: 'Pending' };

      expect(component.statusLabel).toBe('Pending');
    });
  });

  it('renders the order total and status in the template', () => {
    component.order = baseOrder;
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Delivered');
  });
});
