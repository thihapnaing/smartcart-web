import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminBar } from '../../admin/components/admin-bar/admin-bar';

/**
 * Shell for all admin routes: admin top bar + router-outlet. Mirrors CustomerLayout,
 * but no chat widget - the AI shopping assistant is customer-facing only.
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminBar],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {}
