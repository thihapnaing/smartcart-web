import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { MerchantLayout } from './merchant-layout';
import { AuthService } from '../../services/auth.service';

describe('MerchantLayout', () => {
  let component: MerchantLayout;
  let fixture: ComponentFixture<MerchantLayout>;

  let authService: {
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authService = {
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MerchantLayout],

      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },

        // Provide Angular Router for RouterLink,
        // RouterLinkActive and RouterOutlet.
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MerchantLayout);

    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  // ==========================================================
  // Component creation
  // ==========================================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ==========================================================
  // Logout
  // ==========================================================

  it('should call AuthService.logout() when logout() is called', () => {
    component.logout();

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });
});
