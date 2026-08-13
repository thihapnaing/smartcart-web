import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AdminLogin } from './admin-login';
import { AdminAuthService } from '../../services/admin-auth';
import { AdminDashboardService } from '../../services/admin-dashboard';
import { AdminDashboardStats } from '../../models/admin-dashboard-stats';

describe('AdminLogin', () => {
  let fixture: ComponentFixture<AdminLogin>;
  let component: AdminLogin;
  let adminAuth: AdminAuthService;
  let adminDashboardService: { getStats: ReturnType<typeof vi.fn> };
  let router: Router;

  const baseStats: AdminDashboardStats = {
    totalRevenue: 1234.56,
    activeListings: 10,
    inactiveListings: 2,
    newListingsThisWeek: 3,
    activeMerchants: 4,
    categoryBreakdown: [],
    genderSplit: [],
    recentListings: [],
  };

  const setup = () => {
    fixture = TestBed.createComponent(AdminLogin);
    component = fixture.componentInstance;
  };

  beforeEach(async () => {
    sessionStorage.clear();
    adminDashboardService = { getStats: vi.fn().mockReturnValue(of(baseStats)) };

    await TestBed.configureTestingModule({
      imports: [AdminLogin],
      providers: [provideRouter([]), { provide: AdminDashboardService, useValue: adminDashboardService }],
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
      adminDashboardService.getStats.mockReturnValue(throwError(() => new Error('boom')));
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

    it('logs in and navigates to the dashboard when both fields are filled', () => {
      vi.spyOn(adminAuth, 'login');
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component.email = 'admin@smartcart.com';
      component.password = 'secret';

      component.onSubmit();

      expect(component.error()).toBe('');
      expect(component.submitting()).toBe(true);
      expect(adminAuth.login).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    });
  });
});
