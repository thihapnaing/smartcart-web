import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { AdminBar } from './admin-bar';
import { AdminAuthService } from '../../services/admin-auth';

describe('AdminBar', () => {
  let fixture: ComponentFixture<AdminBar>;
  let component: AdminBar;
  let router: Router;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AdminBar],
      providers: [provideRouter([])],
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

  it('signOut() logs the admin out and navigates to /admin/login', () => {
    vi.spyOn(component.adminAuth, 'logout');
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    (component.adminAuth as AdminAuthService).login();

    component.signOut();

    expect(component.adminAuth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
  });
});
