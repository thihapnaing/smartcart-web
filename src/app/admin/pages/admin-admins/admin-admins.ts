import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminAccountService } from '../../services/admin-account';
import { AdminAccount } from '../../models/admin-account';

// AUTHOR: Htet Nandar(Grace)
/**
 * As an admin, I want to see every admin account and invite new ones so that the platform never
 * needs a public admin sign-up form (see AdminAccountController on the backend). New accounts
 * start on a fixed temporary password and are forced to replace it on first login - this page
 * shows that password exactly once, right after creation, and never again.
 */
@Component({
  selector: 'app-admin-admins',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-admins.html',
  styleUrl: './admin-admins.css',
})
export class AdminAdmins implements OnInit {
  admins = signal<AdminAccount[]>([]);
  loading = signal(true);

  searchTerm = signal('');

  filteredAdmins = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.admins();
    return this.admins().filter(
      (a) => a.username.toLowerCase().includes(term) || a.email.toLowerCase().includes(term),
    );
  });

  // Add-admin modal state.
  showAddModal = signal(false);
  newUsername = '';
  newEmail = '';
  createError = signal('');
  creating = signal(false);

  // Set only right after a successful create - holds the one-time temporary password reveal.
  // Cleared as soon as the modal is closed so it never lingers in memory longer than needed.
  createdAdmin = signal<AdminAccount | null>(null);

  constructor(private readonly adminAccountService: AdminAccountService) {}

  ngOnInit(): void {
    this.loadAdmins();
  }

  private loadAdmins(): void {
    this.loading.set(true);
    this.adminAccountService.getAllAdmins().subscribe({
      next: (data) => {
        this.admins.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  openAddModal(): void {
    this.newUsername = '';
    this.newEmail = '';
    this.createError.set('');
    this.createdAdmin.set(null);
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
    this.createdAdmin.set(null);
    this.createError.set('');
  }

  onCreateSubmit(): void {
    const username = this.newUsername.trim();
    const email = this.newEmail.trim();

    if (!username || !email) {
      this.createError.set('Enter a username and email to continue.');
      return;
    }

    this.creating.set(true);
    this.createError.set('');

    this.adminAccountService.createAdmin({ username, email }).subscribe({
      next: (created) => {
        this.admins.update((list) => [created, ...list]);
        this.createdAdmin.set(created);
        this.creating.set(false);
      },
      error: (err) => {
        this.createError.set(err?.error?.message ?? 'Could not create the admin account.');
        this.creating.set(false);
      },
    });
  }
}
