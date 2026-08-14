import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { ChatWidget } from './chat-widget';
import { environment } from '../../../../../environments/environment';
import { ChatResponse } from '../../models/chat.model';

describe('ChatWidget', () => {
  let component: ChatWidget;
  let fixture: ComponentFixture<ChatWidget>;
  let httpTestingController: HttpTestingController;

  const flushStartSession = (response: Partial<ChatResponse> = {}) => {
    const request = httpTestingController.expectOne(`${environment.apiUrl}/chat/start`);
    request.flush({
      sessionId: 'session-1',
      reply: 'Hi! I am your SmartCart AI assistant.',
      suggestions: ['Outfit under $50'],
      ...response
    });
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatWidget],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatWidget);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create and start a chat session on init', () => {
    fixture.detectChanges();
    flushStartSession();

    expect(component).toBeTruthy();
    expect(component.chat.messages()).toHaveLength(1);
    expect(component.chat.messages()[0].senderRole).toBe('assistant');
  });

  it('shows a fallback message when the AI service cannot be reached on startup', () => {
    fixture.detectChanges();

    const request = httpTestingController.expectOne(`${environment.apiUrl}/chat/start`);
    request.flush('boom', { status: 500, statusText: 'Server Error' });

    const messages = component.chat.messages();
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toContain("Couldn't connect to SmartCart AI");
  });

  describe('once a session has started', () => {
    beforeEach(() => {
      fixture.detectChanges();
      flushStartSession();
    });

    it('toggle() opens and closes the chat panel', () => {
      expect(component.isOpen).toBe(false);

      component.toggle();
      expect(component.isOpen).toBe(true);

      component.toggle();
      expect(component.isOpen).toBe(false);
    });

    it('toggleExpand() switches between the default and expanded panel size', () => {
      expect(component.isExpanded).toBe(false);

      component.toggleExpand();
      expect(component.isExpanded).toBe(true);

      component.toggleExpand();
      expect(component.isExpanded).toBe(false);
    });

    it('send() does nothing when the draft is empty or only whitespace', () => {
      vi.spyOn(component.chat, 'sendMessage').mockImplementation(() => {});

      component.draft = '   ';
      component.send();

      expect(component.chat.sendMessage).not.toHaveBeenCalled();
    });

    it('send() forwards a non-empty draft to Chat.sendMessage and clears the input', () => {
      vi.spyOn(component.chat, 'sendMessage').mockImplementation(() => {});

      component.draft = 'Show me new arrivals';
      component.send();

      expect(component.chat.sendMessage).toHaveBeenCalledWith('Show me new arrivals');
      expect(component.draft).toBe('');
    });

    it('onChipClicked() forwards the chip text to Chat.sendMessage', () => {
      vi.spyOn(component.chat, 'sendMessage').mockImplementation(() => {});

      component.onChipClicked('New arrivals');

      expect(component.chat.sendMessage).toHaveBeenCalledWith('New arrivals');
    });
  });
});
