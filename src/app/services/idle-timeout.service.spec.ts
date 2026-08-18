import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { IdleTimeoutService } from './idle-timeout.service';
import { AuthService } from './auth.service';

describe('IdleTimeoutService', () => {
  let service: IdleTimeoutService;

  let authService: {
    logout: ReturnType<typeof vi.fn>;
  };

  let router: {
    navigate: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();

    authService = {
      logout: vi.fn(),
    };

    router = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        IdleTimeoutService,

        {
          provide: AuthService,
          useValue: authService,
        },

        {
          provide: Router,
          useValue: router,
        },
      ],
    });

    service = TestBed.inject(IdleTimeoutService);
  });

  afterEach(() => {
    service.stop();

    vi.clearAllTimers();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // =========================================================
  // CREATE
  // =========================================================

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // =========================================================
  // START
  // =========================================================

  it('should start the idle timer', () => {
    service.start();

    vi.advanceTimersByTime(5 * 60 * 1000 - 1);

    expect(authService.logout).not.toHaveBeenCalled();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  // =========================================================
  // IDLE TIMEOUT
  // =========================================================

  it('should logout after 5 minutes of inactivity', () => {
    service.start();

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(authService.logout).toHaveBeenCalledTimes(1);

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  // =========================================================
  // USER ACTIVITY
  // =========================================================

  it('should reset the timer when mouse moves', () => {
    service.start();

    // Wait 4 minutes.
    vi.advanceTimersByTime(4 * 60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();

    // User activity.
    window.dispatchEvent(new Event('mousemove'));

    // One minute after activity.
    vi.advanceTimersByTime(60 * 1000);

    // Should NOT logout because timer was reset.
    expect(authService.logout).not.toHaveBeenCalled();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  // =========================================================
  // ACTIVITY AT DIFFERENT EVENTS
  // =========================================================

  it('should reset the timer on click', () => {
    service.start();

    vi.advanceTimersByTime(4 * 60 * 1000);

    window.dispatchEvent(new Event('click'));

    vi.advanceTimersByTime(60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('should reset the timer on keydown', () => {
    service.start();

    vi.advanceTimersByTime(4 * 60 * 1000);

    window.dispatchEvent(new Event('keydown'));

    vi.advanceTimersByTime(60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('should reset the timer on scroll', () => {
    service.start();

    vi.advanceTimersByTime(4 * 60 * 1000);

    window.dispatchEvent(new Event('scroll'));

    vi.advanceTimersByTime(60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('should reset the timer on mousedown', () => {
    service.start();

    vi.advanceTimersByTime(4 * 60 * 1000);

    window.dispatchEvent(new Event('mousedown'));

    vi.advanceTimersByTime(60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('should reset the timer on touchstart', () => {
    service.start();

    vi.advanceTimersByTime(4 * 60 * 1000);

    window.dispatchEvent(new Event('touchstart'));

    vi.advanceTimersByTime(60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();
  });

  // =========================================================
  // STOP
  // =========================================================

  it('should stop the idle timer', () => {
    service.start();

    service.stop();

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  // =========================================================
  // LOGOUT CANCELS TIMER
  // =========================================================

  it('should cancel the idle timer when stop is called', () => {
    service.start();

    service.stop();

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  // =========================================================
  // ACTIVITY AFTER STOP
  // =========================================================

  it('should not restart the timer after stop', () => {
    service.start();

    service.stop();

    window.dispatchEvent(new Event('mousemove'));

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  // =========================================================
  // START ONLY ONCE
  // =========================================================

  it('should not register duplicate activity listeners when start is called twice', () => {
    service.start();

    service.start();

    // Move almost to timeout.
    vi.advanceTimersByTime(4 * 60 * 1000);

    window.dispatchEvent(new Event('mousemove'));

    // If duplicate timers/listeners were created,
    // this could incorrectly cause multiple resets.
    vi.advanceTimersByTime(60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();
  });

  // =========================================================
  // TIMEOUT NAVIGATION
  // =========================================================

  it('should navigate to login after idle timeout', () => {
    service.start();

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(router.navigate).toHaveBeenCalledTimes(1);

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  // =========================================================
  // LOGOUT BEFORE TIMEOUT
  // =========================================================

  it('should not logout automatically after manual stop', () => {
    service.start();

    vi.advanceTimersByTime(2 * 60 * 1000);

    service.stop();

    vi.advanceTimersByTime(10 * 60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();

    expect(router.navigate).not.toHaveBeenCalled();
  });
});
