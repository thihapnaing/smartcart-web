import { TestBed } from '@angular/core/testing';
import { AdminAuthService } from './admin-auth';

describe('AdminAuthService', () => {
  let service: AdminAuthService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminAuthService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('starts logged out when there is no session flag in sessionStorage', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  it('picks up an existing session flag from sessionStorage on construction', () => {
    sessionStorage.setItem('smartcart_admin_session', 'true');

    // The signal reads sessionStorage in the field initializer, so a fresh instance is needed -
    // the one injected in beforeEach was already constructed before this flag was set.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const freshService = TestBed.inject(AdminAuthService);

    expect(freshService.isLoggedIn()).toBe(true);
  });

  it('login() sets the session flag and marks the user as logged in', () => {
    service.login();

    expect(service.isLoggedIn()).toBe(true);
    expect(sessionStorage.getItem('smartcart_admin_session')).toBe('true');
  });

  it('logout() clears the session flag and marks the user as logged out', () => {
    service.login();

    service.logout();

    expect(service.isLoggedIn()).toBe(false);
    expect(sessionStorage.getItem('smartcart_admin_session')).toBeNull();
  });
});
