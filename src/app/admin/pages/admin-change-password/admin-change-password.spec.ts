import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AdminChangePassword } from './admin-change-password';
import { AdminAuthService } from '../../services/admin-auth';

describe('AdminChangePassword', () => {
  let fixture: ComponentFixture<AdminChangePassword>;
  let component: AdminChangePassword;
  let adminAuth: AdminAuthService;
  let router: Router;

  const setup = () => {
    fixture = TestBed.createComponent(AdminChangePassword);
    component = fixture.componentInstance;
  };

  beforeEach(async () => {
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AdminChangePassword],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    adminAuth = TestBed.inject(AdminAuthService);
    router = TestBed.inject(Router);
    setup();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onSubmit', () => {
    it('shows an error and does not call the service when either field is blank', () => {
      vi.spyOn(adminAuth, 'changePassword');
      component.newPassword = '';
      component.confirmPassword = 'newpassword123';

      component.onSubmit();

      expect(component.error()).toBe('Enter and confirm your new password to continue.');
      expect(adminAuth.changePassword).not.toHaveBeenCalled();
    });

    it('shows an error when both fields are only whitespace', () => {
      component.newPassword = '   ';
      component.confirmPassword = '   ';

      component.onSubmit();

      expect(component.error()).toBe('Enter and confirm your new password to continue.');
    });

    it('shows an error when the new password is under 6 characters', () => {
      vi.spyOn(adminAuth, 'changePassword');
      component.newPassword = 'abc';
      component.confirmPassword = 'abc';

      component.onSubmit();

      expect(component.error()).toBe('Password must be at least 6 characters.');
      expect(adminAuth.changePassword).not.toHaveBeenCalled();
    });

    it('shows an error when the passwords do not match', () => {
      vi.spyOn(adminAuth, 'changePassword');
      component.newPassword = 'newpassword123';
      component.confirmPassword = 'somethingElse123';

      component.onSubmit();

      expect(component.error()).toBe('Passwords do not match.');
      expect(adminAuth.changePassword).not.toHaveBeenCalled();
    });

    it('calls the service and navigates to the dashboard on success', () => {
      vi.spyOn(adminAuth, 'changePassword').mockReturnValue(of({ message: 'Password changed successfully' }));
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component.newPassword = 'newpassword123';
      component.confirmPassword = 'newpassword123';

      component.onSubmit();

      expect(adminAuth.changePassword).toHaveBeenCalledWith('newpassword123', 'newpassword123');
      expect(component.error()).toBe('');
      expect(component.submitting()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    });

    it('shows the backend error message when the request fails', () => {
      vi.spyOn(adminAuth, 'changePassword').mockReturnValue(
        throwError(() => ({ error: 'Passwords do not match' })),
      );
      component.newPassword = 'newpassword123';
      component.confirmPassword = 'newpassword123';

      component.onSubmit();

      expect(component.error()).toBe('Passwords do not match');
      expect(component.submitting()).toBe(false);
    });

    it('falls back to a generic error message when the failure has no message', () => {
      vi.spyOn(adminAuth, 'changePassword').mockReturnValue(throwError(() => ({})));
      component.newPassword = 'newpassword123';
      component.confirmPassword = 'newpassword123';

      component.onSubmit();

      expect(component.error()).toBe('Could not change your password.');
    });
  });
});
