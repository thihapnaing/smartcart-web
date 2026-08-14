import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Chat } from './chat';
import { environment } from '../../../../environments/environment';
import { ChatResponse } from '../models/chat.model';

describe('Chat', () => {
  let chat: Chat;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    chat = TestBed.inject(Chat);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('startSession', () => {
    it('sends a POST to /chat/start and seeds sessionId, suggestions, and the greeting message', () => {
      const fakeResponse: ChatResponse = {
        sessionId: 'session-1',
        reply: 'Hi there',
        suggestions: ['Outfit under $50'],
        products: [],
        orders: []
      };

      chat.startSession().subscribe();

      const request = httpTestingController.expectOne(`${environment.apiUrl}/chat/start`);
      expect(request.request.method).toBe('POST');
      request.flush(fakeResponse);

      expect(chat.sessionId()).toBe('session-1');
      expect(chat.suggestions()).toEqual(['Outfit under $50']);
      expect(chat.messages()).toHaveLength(1);
      expect(chat.messages()[0].senderRole).toBe('assistant');
      expect(chat.messages()[0].content).toBe('Hi there');
    });

    it('defaults suggestions to an empty array when the response omits them', () => {
      chat.startSession().subscribe();

      const request = httpTestingController.expectOne(`${environment.apiUrl}/chat/start`);
      request.flush({ sessionId: 'session-2', reply: 'Hi there' } as ChatResponse);

      expect(chat.suggestions()).toEqual([]);
    });
  });

  describe('sendMessage', () => {
    it('does nothing when there is no active session', () => {
      chat.sendMessage('hello');

      httpTestingController.expectNone(() => true);
      expect(chat.messages()).toHaveLength(0);
    });

    it('does nothing when the message is empty or only whitespace', () => {
      chat.startSession().subscribe();
      httpTestingController.expectOne(`${environment.apiUrl}/chat/start`).flush({
        sessionId: 'session-3',
        reply: 'Hi there'
      } as ChatResponse);

      chat.sendMessage('   ');

      httpTestingController.expectNone(`${environment.apiUrl}/chat/session-3`);
    });

    it('does nothing while a previous message is still loading', () => {
      chat.startSession().subscribe();
      httpTestingController.expectOne(`${environment.apiUrl}/chat/start`).flush({
        sessionId: 'session-4',
        reply: 'Hi there'
      } as ChatResponse);

      chat.sendMessage('first message');
      httpTestingController.expectOne(`${environment.apiUrl}/chat/session-4`);

      chat.sendMessage('second message while still loading');

      httpTestingController.expectNone(
        (req) => req.url === `${environment.apiUrl}/chat/session-4` && req.body?.message === 'second message while still loading'
      );
    });

    it('appends the user message, posts it, and appends the assistant reply on success', () => {
      chat.startSession().subscribe();
      httpTestingController.expectOne(`${environment.apiUrl}/chat/start`).flush({
        sessionId: 'session-5',
        reply: 'Hi there'
      } as ChatResponse);

      chat.sendMessage('Show me new arrivals');

      expect(chat.isLoading()).toBe(true);
      expect(chat.messages()).toHaveLength(2);
      expect(chat.messages()[1]).toEqual(
        expect.objectContaining({ senderRole: 'user', content: 'Show me new arrivals' })
      );

      const request = httpTestingController.expectOne(`${environment.apiUrl}/chat/session-5`);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({ message: 'Show me new arrivals' });

      request.flush({ sessionId: 'session-5', reply: 'Here you go', suggestions: ['New arrivals'] } as ChatResponse);

      expect(chat.isLoading()).toBe(false);
      expect(chat.suggestions()).toEqual(['New arrivals']);
      expect(chat.messages()).toHaveLength(3);
      expect(chat.messages()[2]).toEqual(
        expect.objectContaining({ senderRole: 'assistant', content: 'Here you go' })
      );
    });

    it('appends a friendly fallback message and clears loading when the request fails', () => {
      chat.startSession().subscribe();
      httpTestingController.expectOne(`${environment.apiUrl}/chat/start`).flush({
        sessionId: 'session-6',
        reply: 'Hi there'
      } as ChatResponse);

      chat.sendMessage('Show me new arrivals');

      const request = httpTestingController.expectOne(`${environment.apiUrl}/chat/session-6`);
      request.flush('boom', { status: 500, statusText: 'Server Error' });

      expect(chat.isLoading()).toBe(false);
      expect(chat.messages()).toHaveLength(3);
      expect(chat.messages()[2].content).toBe('Sorry, something went wrong. Please try again.');
    });
  });
});
