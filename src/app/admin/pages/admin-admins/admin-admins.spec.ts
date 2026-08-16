import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AdminAdmins } from './admin-admins';
import { AdminAccountService } from '../../services/admin-account';
import { AdminAccount } from '../../models/admin-account';

describe('AdminAdmins', () => {
  let fixture: ComponentFixture<AdminAdmins>;
  let component: AdminAdmins;
  let adminAccountService: {
    getAllAdmins: ReturnType<typeof vi.fn>;
    createAdmin: ReturnType<typeof vi.fn>;
  };

  const admin = (overrides: Partial<AdminAccount>): AdminAccount => ({
    id: 1,
    username: 'firstadmin',
    email: 'firstadmin@smartcart.demo',
    status: 'ACTIVE',
    createdAt: '2026-01-10T00:00:00Z',
    mustChangePassword: false,
    ...overrides,
  });

  const sampleAdmins: AdminAccount[] = [
    admin({ id: 2, username: 'secondadmin', email: 'secondadmin@smartcart.demo', mustChangePassword: true }),
    admin({ id: 1, username: 'firstadmin', email: 'firstadmin@smartcart.demo', mustChangePassword: false }),
  ];

  const setup = () => {
    fixture = TestBed.createComponent(AdminAdmins);
    component = fixture.componentInstance;
  };

  beforeEach(async () => {
    adminAccountService = {
      getAllAdmins: vi.fn().mockReturnValue(of(sampleAdmins)),
      createAdmin: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminAdmins],
      providers: [{ provide: AdminAccountService, useValue: adminAccountService }],
    }).compileComponents();
  });

  it('should create', () => {
    setup();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit / loadAdmins', () => {
    it('loads admins and stops loading on success', () => {
      setup();
      fixture.detectChanges();

      expect(component.admins()).toEqual(sampleAdmins);
      expect(component.loading()).toBe(false);
    });

    it('stops loading (without setting admins) when the request fails', () => {
      adminAccountService.getAllAdmins.mockReturnValue(throwError(() => new Error('boom')));
      setup();
      fixture.detectChanges();

      expect(component.admins()).toEqual([]);
      expect(component.loading()).toBe(false);
    });
  });

  describe('filteredAdmins', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    it('returns every admin when the search term is blank', () => {
      expect(component.filteredAdmins()).toEqual(sampleAdmins);
    });

    it('matches by username (case-insensitive)', () => {
      component.searchTerm.set('FIRSTADMIN');
      expect(component.filteredAdmins().map((a) => a.id)).toEqual([1]);
    });

    it('matches by email (case-insensitive)', () => {
      component.searchTerm.set('secondadmin@smartcart.demo');
      expect(component.filteredAdmins().map((a) => a.id)).toEqual([2]);
    });
  });

  describe('onSearchChange', () => {
    it('sets the search term', () => {
      setup();
      fixture.detectChanges();

      component.onSearchChange('second');
      expect(component.searchTerm()).toBe('second');
    });
  });

  describe('openAddModal / closeAddModal', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    it('openAddModal resets the form and opens the modal', () => {
      component.newUsername = 'stale';
      component.newEmail = 'stale@example.com';
      component.createError.set('stale error');
      component.createdAdmin.set(admin({ id: 9 }));

      component.openAddModal();

      expect(component.showAddModal()).toBe(true);
      expect(component.newUsername).toBe('');
      expect(component.newEmail).toBe('');
      expect(component.createError()).toBe('');
      expect(component.createdAdmin()).toBeNull();
    });

    it('closeAddModal hides the modal and clears created/error state', () => {
      component.openAddModal();
      component.createdAdmin.set(admin({ id: 9 }));
      component.createError.set('some error');

      component.closeAddModal();

      expect(component.showAddModal()).toBe(false);
      expect(component.createdAdmin()).toBeNull();
      expect(component.createError()).toBe('');
    });
  });

  describe('onCreateSubmit', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    it('shows an error and does not call the service when username or email is blank', () => {
      component.newUsername = '';
      component.newEmail = 'newadmin@smartcart.demo';

      component.onCreateSubmit();

      expect(component.createError()).toBe('Enter a username and email to continue.');
      expect(adminAccountService.createAdmin).not.toHaveBeenCalled();
    });

    it('shows an error when both fields are only whitespace', () => {
      component.newUsername = '   ';
      component.newEmail = '   ';

      component.onCreateSubmit();

      expect(component.createError()).toBe('Enter a username and email to continue.');
      expect(adminAccountService.createAdmin).not.toHaveBeenCalled();
    });

    it('creates the admin, prepends it to the list, and reveals the temporary password', () => {
      const created = admin({ id: 3, username: 'newadmin', email: 'newadmin@smartcart.demo', mustChangePassword: true, temporaryPassword: '123456' });
      adminAccountService.createAdmin.mockReturnValue(of(created));
      component.newUsername = 'newadmin';
      component.newEmail = 'newadmin@smartcart.demo';

      component.onCreateSubmit();

      expect(adminAccountService.createAdmin).toHaveBeenCalledWith({
        username: 'newadmin',
        email: 'newadmin@smartcart.demo',
      });
      expect(component.admins()[0]).toEqual(created);
      expect(component.createdAdmin()).toEqual(created);
      expect(component.creating()).toBe(false);
    });

    it('shows the backend error message and does not touch the admin list when creation fails', () => {
      adminAccountService.createAdmin.mockReturnValue(
        throwError(() => ({ error: { message: 'Email is already registered' } })),
      );
      component.newUsername = 'newadmin';
      component.newEmail = 'newadmin@smartcart.demo';

      component.onCreateSubmit();

      expect(component.createError()).toBe('Email is already registered');
      expect(component.creating()).toBe(false);
      expect(component.admins()).toEqual(sampleAdmins);
    });

    it('falls back to a generic error message when the failure has no message', () => {
      adminAccountService.createAdmin.mockReturnValue(throwError(() => ({})));
      component.newUsername = 'newadmin';
      component.newEmail = 'newadmin@smartcart.demo';

      component.onCreateSubmit();

      expect(component.createError()).toBe('Could not create the admin account.');
    });
  });

  // Drives the rendered template (clicks, ngModel) instead of calling component methods
  // directly, so the click/ngModelChange listeners generated from admin-admins.html - and the
  // @if/@for branches they gate - are the ones under test here.
  describe('DOM interactions', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    it('typing in the search box filters the table via the real ngModel binding', () => {
      const input = fixture.nativeElement.querySelector('#admin-search') as HTMLInputElement;
      input.value = 'second';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.searchTerm()).toBe('second');
      const rows = fixture.nativeElement.querySelectorAll('.table-row:not(.table-row--head)');
      expect(rows()).toHaveLength(1);
      expect(rows[0].textContent).toContain('secondadmin');
    });

    it('shows a "Pending setup" badge for admins that still must change their password', () => {
      const rows = fixture.nativeElement.querySelectorAll('.table-row:not(.table-row--head)');
      expect(rows[0].textContent).toContain('Pending setup');
      expect(rows[1].textContent).toContain('Active');
    });

    it('clicking "+ Add Admin" opens the modal', () => {
      expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeNull();

      (fixture.nativeElement.querySelector('.add-admin-btn') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeTruthy();
    });

    it('clicking the close button closes the modal', () => {
      component.openAddModal();
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('.modal-close-btn') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeNull();
    });

    it('clicking the backdrop closes the modal, but clicking inside the panel does not', () => {
      component.openAddModal();
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('.modal-panel') as HTMLElement).click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeTruthy();

      (fixture.nativeElement.querySelector('.modal-backdrop') as HTMLElement).click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeNull();
    });

    it('submitting the form with real ngModel-bound inputs creates the admin and shows the temporary password', async () => {
      const created = admin({ id: 3, username: 'newadmin', email: 'newadmin@smartcart.demo', mustChangePassword: true, temporaryPassword: '123456' });
      adminAccountService.createAdmin.mockReturnValue(of(created));

      component.openAddModal();
      fixture.detectChanges();
      // Template-driven [(ngModel)] registers its control with the parent NgForm via a
      // queued microtask (NgForm.addControl isn't called synchronously from ngOnInit) -
      // without this, dispatching 'input' below can race ahead of that registration.
      await fixture.whenStable();

      const usernameInput = fixture.nativeElement.querySelector('#new-admin-username') as HTMLInputElement;
      usernameInput.value = 'newadmin';
      usernameInput.dispatchEvent(new Event('input'));

      const emailInput = fixture.nativeElement.querySelector('#new-admin-email') as HTMLInputElement;
      emailInput.value = 'newadmin@smartcart.demo';
      emailInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
        new Event('submit', { cancelable: true }),
      );
      fixture.detectChanges();

      expect(adminAccountService.createAdmin).toHaveBeenCalledWith({
        username: 'newadmin',
        email: 'newadmin@smartcart.demo',
      });

      const panel = fixture.nativeElement.querySelector('.modal-panel') as HTMLElement;
      expect(panel.querySelector('.temp-password-value')?.textContent).toContain('123456');
    });

    it('clicking Done after a successful create closes the modal', () => {
      const created = admin({ id: 3, username: 'newadmin', temporaryPassword: '123456' });
      adminAccountService.createAdmin.mockReturnValue(of(created));
      component.openAddModal();
      component.newUsername = 'newadmin';
      component.newEmail = 'newadmin@smartcart.demo';
      component.onCreateSubmit();
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('.submit-btn') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeNull();
    });
  });
});
