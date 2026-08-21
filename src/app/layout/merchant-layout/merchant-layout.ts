import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-merchant-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './merchant-layout.html',
  styleUrl: './merchant-layout.css',
})
export class MerchantLayout {
  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
