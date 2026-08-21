import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { AdminBar } from './admin-bar';

describe('AdminBar', () => {
  let fixture: ComponentFixture<AdminBar>;
  let component: AdminBar;
  let router: Router;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AdminBar],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminBar);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the signed-in admin\'s username and initial when set', () => {
    component.adminAuth.username.set('grace_admin');
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.admin-chip') as HTMLElement;
    expect(chip.textContent).toContain('grace_admin');
    expect(chip.querySelector('.admin-chip-avatar')?.textContent).toBe('G');
  });

  it('falls back to a generic "Admin" chip when no username is known', () => {
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.admin-chip') as HTMLElement;
    expect(chip.textContent).toContain('Admin');
    expect(chip.querySelector('.admin-chip-avatar')?.textContent).toBe('A');
  });

  it('signOut() logs the admin out and navigates to /admin/login', () => {
    vi.spyOn(component.adminAuth, 'logout');
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.adminAuth.isLoggedIn.set(true);

    component.signOut();

    expect(component.adminAuth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
  });
});
