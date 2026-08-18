import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { IdleTimeoutService } from './idle-timeout.service';
import { AuthService } from './auth.service';

describe('IdleTimeoutService', () => {
  let service: IdleTimeoutService;

  let authService: {
    logout: ReturnType<typeof vi.fn>;
  };

  let router: Router;

  beforeEach(() => {
    vi.useFakeTimers();

    authService = {
      logout: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        IdleTimeoutService,

        {
          provide: AuthService,
          useValue: authService,
        },

        provideRouter([]),
      ],
    });

    service = TestBed.inject(IdleTimeoutService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    service.stop();

    vi.clearAllTimers();

    vi.useRealTimers();
  });

  // ==========================================================
  // SERVICE CREATION
  // ==========================================================

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  // ==========================================================
  // START
  // ==========================================================

  it('should start the idle timer', () => {
    service.start();

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });

  it('should not start multiple timers when start() is called twice', () => {
    service.start();
    service.start();

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });

  // ==========================================================
  // USER ACTIVITY
  // ==========================================================

  it('should reset the timer when the user moves the mouse', () => {
    service.start();

    vi.advanceTimersByTime(4 * 60 * 1000);

    window.dispatchEvent(new MouseEvent('mousemove'));

    vi.advanceTimersByTime(4 * 60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1 * 60 * 1000);

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });

  it('should reset the timer when the user clicks', () => {
    service.start();

    vi.advanceTimersByTime(4 * 60 * 1000);

    window.dispatchEvent(new MouseEvent('click'));

    vi.advanceTimersByTime(4 * 60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1 * 60 * 1000);

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });

  it('should reset the timer when the user presses a key', () => {
    service.start();

    vi.advanceTimersByTime(4 * 60 * 1000);

    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'a',
      }),
    );

    vi.advanceTimersByTime(4 * 60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1 * 60 * 1000);

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });

  it('should reset the timer when the user scrolls', () => {
    service.start();

    vi.advanceTimersByTime(4 * 60 * 1000);

    window.dispatchEvent(new Event('scroll'));

    vi.advanceTimersByTime(4 * 60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1 * 60 * 1000);

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });

  // ==========================================================
  // IDLE TIMEOUT
  // ==========================================================

  it('should logout after 5 minutes of inactivity', () => {
    service.start();

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });

  it('should navigate to login after idle timeout', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    service.start();

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should logout and navigate to login after idle timeout', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    service.start();

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(authService.logout).toHaveBeenCalledTimes(1);

    expect(navigateSpy).toHaveBeenCalledTimes(1);

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  // ==========================================================
  // STOP
  // ==========================================================

  it('should stop the idle timer', () => {
    service.start();

    service.stop();

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('should allow start after stop', () => {
    service.start();

    service.stop();

    service.start();

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });

  it('should safely handle stop when service is not started', () => {
    expect(() => {
      service.stop();
    }).not.toThrow();

    expect(authService.logout).not.toHaveBeenCalled();
  });

  // ==========================================================
  // ACTIVITY AFTER STOP
  // ==========================================================

  it('should not logout after stop even if activity occurs', () => {
    service.start();

    service.stop();

    window.dispatchEvent(new MouseEvent('mousemove'));

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();
  });

  // ==========================================================
  // ALL SUPPORTED EVENTS
  // ==========================================================

  it('should reset timeout for supported activity events', () => {
    const events = [
      new MouseEvent('mousemove'),
      new MouseEvent('mousedown'),
      new KeyboardEvent('keydown'),
      new Event('scroll'),
      new Event('touchstart'),
      new MouseEvent('click'),
    ];

    service.start();

    for (const event of events) {
      vi.advanceTimersByTime(4 * 60 * 1000);

      window.dispatchEvent(event);

      expect(authService.logout).not.toHaveBeenCalled();
    }

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });
});
