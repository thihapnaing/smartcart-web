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
    // No userId sent from the client - the backend resolves the current customer itself
    // (CurrentUserProvider.getCurrentCustomer(), hardcoded to id 2L/Grace until JWT auth lands).
    this.chat.startSession().subscribe({
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
