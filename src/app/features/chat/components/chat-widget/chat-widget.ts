// Author: Htet Nandar (Grace)
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chat } from '../../services/chat';
import { ChatMessageList } from '../chat-message-list/chat-message-list';
import { SuggestionChips } from '../suggestion-chips/suggestion-chips';

/** Floating chat bubble mounted once in App so it's available on every page. */
@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatMessageList, SuggestionChips],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.css'
})
export class ChatWidget implements OnInit {
  isOpen = false;
  draft = '';

  constructor(public chat: Chat) {}

  ngOnInit(): void {
    // Hardcoded until JWT auth lands - matches CartController's hardcoded 2L (Grace),
    // the customer the seeded demo order/order-history belongs to.
    this.chat.startSession(2).subscribe({
      error: () => {
        this.chat.messages.set([
          {
            senderRole: 'assistant',
            content: "Couldn't connect to SmartCart AI. Make sure the backend is running, then reopen this chat.",
            createdAt: new Date().toISOString()
          }
        ]);
      }
    });
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  send(): void {
    if (!this.draft.trim()) return;
    this.chat.sendMessage(this.draft);
    this.draft = '';
  }

  onChipClicked(text: string): void {
    this.chat.sendMessage(text);
  }
}
