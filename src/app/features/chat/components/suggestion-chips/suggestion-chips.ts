// Author: Htet Nandar (Grace)
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-suggestion-chips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './suggestion-chips.html',
  styleUrl: './suggestion-chips.css'
})
export class SuggestionChips {
  @Input() suggestions: string[] = [];
  @Input() disabled = false;
  @Output() chipClicked = new EventEmitter<string>();
}
