import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ChatMessageList } from './chat-message-list';
import { ChatMessage } from '../../models/chat.model';
import { environment } from '../../../../../environments/environment';

describe('ChatMessageList', () => {
  let fixture: ComponentFixture<ChatMessageList>;
  let component: ChatMessageList;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatMessageList],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatMessageList);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // ProductMiniCard's CartService fetches the cart on construction - only relevant for tests
    // that actually render a product card, but harmless to check unconditionally.
    httpTestingController.match(`${environment.apiUrl}/cart`).forEach((req) => req.flush({ cartItemDetails: [], cartTotal: 0 }));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders nothing when there are no messages', () => {
    component.messages = [];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.message').length).toBe(0);
  });

  it('renders one bubble per message with its content', () => {
    component.messages = [
      { senderRole: 'assistant', content: 'Hi there', createdAt: '2026-01-01T00:00:00Z' },
      { senderRole: 'user', content: 'Show me new arrivals', createdAt: '2026-01-01T00:01:00Z' },
    ];
    fixture.detectChanges();

    const bubbles: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.message');
    expect(bubbles.length).toBe(2);
    expect(bubbles[0].textContent).toContain('Hi there');
    expect(bubbles[0].classList.contains('user')).toBe(false);
    expect(bubbles[1].textContent).toContain('Show me new arrivals');
    expect(bubbles[1].classList.contains('user')).toBe(true);
  });

  it('renders a product mini card for each product on a message', () => {
    const message: ChatMessage = {
      senderRole: 'assistant',
      content: 'Here are some picks',
      createdAt: '2026-01-01T00:00:00Z',
      products: [
        { productId: 1, name: 'Tee', price: 19.99, imageUrl: 'tee.jpg', category: 'Tops', defaultVariantId: 5 },
      ],
    };
    component.messages = [message];
    fixture.detectChanges();

    httpTestingController.expectOne(`${environment.apiUrl}/cart`).flush({ cartItemDetails: [], cartTotal: 0 });

    expect(fixture.nativeElement.querySelectorAll('app-product-mini-card').length).toBe(1);
  });

  it('renders an order mini card for each order on a message', () => {
    const message: ChatMessage = {
      senderRole: 'assistant',
      content: "Here's your order",
      createdAt: '2026-01-01T00:00:00Z',
      orders: [{ orderId: 101, totalAmount: 45.5, status: 'DELIVERED', orderDate: '2026-08-01' }],
    };
    component.messages = [message];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-order-mini-card').length).toBe(1);
  });
});
