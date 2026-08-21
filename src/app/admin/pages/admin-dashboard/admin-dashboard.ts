import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminDashboardService } from '../../services/admin-dashboard';
import { AdminDashboardStats } from '../../models/admin-dashboard-stats';

// AUTHOR: Htet Nandar(Grace)
/**
 * /admin/dashboard - overview page styled after the Figma admin reference (KPI cards, recent
 * activity, category breakdown, gender split). SmartCart has no pending-approval workflow, so
 * the fourth KPI card is "Inactive Listings" instead of the reference's "Pending Review".
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  stats = signal<AdminDashboardStats | null>(null);
  loading = signal(true);
  today = new Date();

  // A real (not fabricated) health signal: flag it if more than a third of listings are
  // currently deactivated.
  platformHealthy = computed(() => {
    const s = this.stats();
    if (!s) return true;
    const total = s.activeListings + s.inactiveListings;
    if (total === 0) return true;
    return s.inactiveListings / total < 0.33;
  });

  maxCategoryCount = computed(() => {
    const breakdown = this.stats()?.categoryBreakdown ?? [];
    return breakdown.reduce((max, c) => Math.max(max, c.count), 0) || 1;
  });

  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  ngOnInit(): void {
    this.adminDashboardService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  genderLabel(gender: string): string {
    switch (gender) {
      case 'MEN':
        return "Men's";
      case 'WOMEN':
        return "Women's";
      default:
        return gender;
    }
  }

  timeAgo(isoDate: string): string {
    const then = new Date(isoDate).getTime();
    const diffMs = Date.now() - then;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
