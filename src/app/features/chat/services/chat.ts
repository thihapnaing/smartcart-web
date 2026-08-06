// Author: Htet Nandar (Grace)
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ChatMessage, ChatResponse } from '../models/chat.model';

/** Talks to Spring Boot's /api/chat endpoints - the AI chat widget's state and network calls. */
@Injectable({
  providedIn: 'root'
})
export class Chat {
  private readonly apiBase = `${environment.apiUrl}/chat`;

  sessionId = signal<string | null>(null);
  messages = signal<ChatMessage[]>([]);
  suggestions = signal<string[]>([]);
  isLoading = signal<boolean>(false);

  constructor(private readonly http: HttpClient) {}

  startSession(userId?: number): Observable<ChatResponse> {
    const params: Record<string, number> = {};
    if (userId !== undefined) {
      params['userId'] = userId;
    }
    return this.http.post<ChatResponse>(`${this.apiBase}/start`, {}, { params }).pipe(
      tap((res) => {
        this.sessionId.set(res.sessionId);
        this.suggestions.set(res.suggestions ?? []);
        this.messages.set([
          { senderRole: 'assistant', content: res.reply, createdAt: new Date().toISOString(), products: res.products }
        ]);
      })
    );
  }

  sendMessage(text: string): void {
    const sid = this.sessionId();
    // Guard here (not just in the UI) so a stray double-click, double-tap, or Enter-key repeat
    // can never fire a second request while one is still in flight - the source of truth for
    // "can we send" lives with the request itself, not with whatever disabled a button.
    if (!sid || !text.trim() || this.isLoading()) return;

    this.messages.update((msgs) => [
      ...msgs,
      { senderRole: 'user', content: text, createdAt: new Date().toISOString() }
    ]);
    this.isLoading.set(true);

    this.http.post<ChatResponse>(`${this.apiBase}/${sid}`, { message: text }).subscribe({
      next: (res) => {
        this.suggestions.set(res.suggestions ?? []);
        this.messages.update((msgs) => [
          ...msgs,
          { senderRole: 'assistant', content: res.reply, createdAt: new Date().toISOString(), products: res.products }
        ]);
        this.isLoading.set(false);
      },
      error: () => {
        this.messages.update((msgs) => [
          ...msgs,
          { senderRole: 'assistant', content: 'Sorry, something went wrong. Please try again.', createdAt: new Date().toISOString() }
        ]);
        this.isLoading.set(false);
      }
    });
  }
}
