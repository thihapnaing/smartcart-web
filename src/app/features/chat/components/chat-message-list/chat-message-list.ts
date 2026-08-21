// Author: Htet Nandar (Grace)
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../models/chat.model';
import { ProductMiniCard } from '../product-mini-card/product-mini-card';
import { OrderMiniCard } from '../order-mini-card/order-mini-card';

@Component({
  selector: 'app-chat-message-list',
  standalone: true,
  imports: [CommonModule, ProductMiniCard, OrderMiniCard],
  templateUrl: './chat-message-list.html',
  styleUrl: './chat-message-list.css'
})
export class ChatMessageList {
  @Input() messages: ChatMessage[] = [];
}
