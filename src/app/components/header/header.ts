import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart';

// This component displays the top bar that appears on every page of the
// site: the logo, the navigation links, the search box, and the icons on
// the right (notifications, cart, compare, profile).
@Component({
  selector: 'app-header',
  imports: [RouterLink, FormsModule],
  templateUrl: './header.html',
})
export class Header {
  // Holds whatever text is currently typed into the search box.
  searchKeyword = signal('');

  // Shows a short message near the camera button after an image is
  // picked, since image search isn't wired up to the backend yet.
  imageSearchMessage = signal('');

  constructor(
    private readonly router: Router,
    protected readonly cart: CartService
  ) {}

  // Runs when Enter is pressed in the search box, or the search icon is clicked.
  onSearch(): void {
    const trimmedKeyword = this.searchKeyword().trim();
    if (!trimmedKeyword) {
      return;
    }
    this.router.navigate(['/search'], { queryParams: { keyword: trimmedKeyword } });
  }

  // Runs when a file is chosen through the hidden file picker triggered
  // by the camera button. Image search isn't available on the backend
  // yet, so this just confirms a file was picked for now.
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selectedFile = input.files?.[0];
    if (selectedFile) {
      this.imageSearchMessage.set('Image search is coming soon.');
    }
    input.value = '';
  }
}