import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AdminLogin } from './admin-login';
import { AdminAuthService } from '../../services/admin-auth';
import { PublicStatsService } from '../../../services/public-stats';
import { PublicStats } from '../../../models/public-stats';
import { LoginResponse } from '../../../models/login-response';

describe('AdminLogin', () => {
  let fixture: ComponentFixture<AdminLogin>;
  let component: AdminLogin;
  let adminAuth: AdminAuthService;
  let publicStatsService: { getStats: ReturnType<typeof vi.fn> };
  let router: Router;

  const baseStats: PublicStats = {
    totalRevenue: 1234.56,
    activeListings: 10,
    activeMerchants: 4,
  };

  const adminResponse: LoginResponse = {
    token: 'fake.jwt.token',
    userId: 4,
    username: 'admin',
    email: 'admin@smartcart.com',
    role: 'ADMIN',
  };

  const setup = () => {
    fixture = TestBed.createComponent(AdminLogin);
    component = fixture.componentInstance;
  };

  beforeEach(async () => {
    sessionStorage.clear();
    publicStatsService = { getStats: vi.fn().mockReturnValue(of(baseStats)) };

    await TestBed.configureTestingModule({
      imports: [AdminLogin],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PublicStatsService, useValue: publicStatsService },
      ],
    }).compileComponents();

    adminAuth = TestBed.inject(AdminAuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    setup();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit / formattedRevenue', () => {
    it('shows a dash before stats have loaded', () => {
      setup();

      expect(component.formattedRevenue()).toBe('—');
    });

    it('formats the loaded revenue as rounded SGD once stats arrive', () => {
      setup();
      fixture.detectChanges();

      expect(component.formattedRevenue()).toBe('S$1,235');
    });

    it('falls back to null stats (and the dash) when the stats request fails', () => {
      publicStatsService.getStats.mockReturnValue(throwError(() => new Error('boom')));
      setup();
      fixture.detectChanges();

      expect(component.stats()).toBeNull();
      expect(component.formattedRevenue()).toBe('—');
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    it('shows an error and does not log in when email or password is blank', () => {
      vi.spyOn(adminAuth, 'login');
      component.email = '';
      component.password = 'secret';

      component.onSubmit();

      expect(component.error()).toBe('Enter both email and password to continue.');
      expect(adminAuth.login).not.toHaveBeenCalled();
    });

    it('shows an error when both fields are only whitespace', () => {
      component.email = '   ';
      component.password = '   ';

      component.onSubmit();

      expect(component.error()).toBe('Enter both email and password to continue.');
    });

    it('logs in and navigates to the dashboard when the account has ADMIN role', () => {
      vi.spyOn(adminAuth, 'login').mockReturnValue(of(adminResponse));
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component.email = 'admin@smartcart.com';
      component.password = 'secret';

      component.onSubmit();

      expect(adminAuth.login).toHaveBeenCalledWith('admin@smartcart.com', 'secret');
      expect(component.error()).toBe('');
      expect(component.submitting()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    });

    it('logs out and shows an error when the account does not have ADMIN role', () => {
      vi.spyOn(adminAuth, 'login').mockReturnValue(of({ ...adminResponse, role: 'CUSTOMER' }));
      vi.spyOn(adminAuth, 'logout');
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component.email = 'customer@smartcart.com';
      component.password = 'secret';

      component.onSubmit();

      expect(adminAuth.logout).toHaveBeenCalled();
      expect(component.error()).toBe('This account does not have admin access.');
      expect(component.submitting()).toBe(false);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('shows the backend error message when the login request fails', () => {
      vi.spyOn(adminAuth, 'login').mockReturnValue(throwError(() => ({ error: 'Invalid credentials' })));
      component.email = 'admin@smartcart.com';
      component.password = 'wrong';

      component.onSubmit();

      expect(component.error()).toBe('Invalid credentials');
      expect(component.submitting()).toBe(false);
    });

    it('falls back to a generic error message when the failure has no message', () => {
      vi.spyOn(adminAuth, 'login').mockReturnValue(throwError(() => ({})));
      component.email = 'admin@smartcart.com';
      component.password = 'wrong';

      component.onSubmit();

      expect(component.error()).toBe('Invalid email or password.');
    });
  });
});
