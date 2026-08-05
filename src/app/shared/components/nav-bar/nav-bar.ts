// Author: Htet Nandar (Grace)
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Cart } from '../../../services/cart';

/**
 * Top nav bar. Only "Home" and "AI Picks" are real routes so far - the rest
 * are placeholders until their features/routes land (product listing, auth, etc.).
 */
@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css'
})
export class NavBar {
  placeholderLinks = ['Women', 'Men', 'Categories'];

  // Below 768px the links + search collapse behind a hamburger toggle.
  menuOpen = false;

  // public so the template can read cartService.itemCount() directly for the badge.
  constructor(public cartService: Cart) {}

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }
}
