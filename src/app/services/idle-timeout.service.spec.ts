import { TestBed } from '@angular/core/testing';
<<<<<<< HEAD
import { provideRouter, Router } from '@angular/router';
=======
import { Router } from '@angular/router';

>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { IdleTimeoutService } from './idle-timeout.service';
import { AuthService } from './auth.service';

describe('IdleTimeoutService', () => {
  let service: IdleTimeoutService;

  let authService: {
    logout: ReturnType<typeof vi.fn>;
  };

<<<<<<< HEAD
  let router: Router;
=======
  let router: {
    navigate: ReturnType<typeof vi.fn>;
  };
>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7

  beforeEach(() => {
    vi.useFakeTimers();

    authService = {
      logout: vi.fn(),
    };

<<<<<<< HEAD
=======
    router = {
      navigate: vi.fn().mockResolvedValue(true),
    };

>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7
    TestBed.configureTestingModule({
      providers: [
        IdleTimeoutService,

        {
          provide: AuthService,
          useValue: authService,
        },

<<<<<<< HEAD
        provideRouter([]),
=======
        {
          provide: Router,
          useValue: router,
        },
>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7
      ],
    });

    service = TestBed.inject(IdleTimeoutService);
<<<<<<< HEAD
    router = TestBed.inject(Router);
=======
>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7
  });

  afterEach(() => {
    service.stop();

    vi.clearAllTimers();
<<<<<<< HEAD

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
=======
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
>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7

  it('should start the idle timer', () => {
    service.start();

<<<<<<< HEAD
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
=======
    vi.advanceTimersByTime(5 * 60 * 1000 - 1);

    expect(authService.logout).not.toHaveBeenCalled();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  // =========================================================
  // IDLE TIMEOUT
  // =========================================================
>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7

  it('should logout after 5 minutes of inactivity', () => {
    service.start();

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(authService.logout).toHaveBeenCalledTimes(1);
<<<<<<< HEAD
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
=======

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
>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7

  it('should stop the idle timer', () => {
    service.start();

    service.stop();

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();
<<<<<<< HEAD
  });

  it('should allow start after stop', () => {
=======

    expect(router.navigate).not.toHaveBeenCalled();
  });

  // =========================================================
  // LOGOUT CANCELS TIMER
  // =========================================================

  it('should cancel the idle timer when stop is called', () => {
>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7
    service.start();

    service.stop();

<<<<<<< HEAD
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
=======
    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  // =========================================================
  // ACTIVITY AFTER STOP
  // =========================================================

  it('should not restart the timer after stop', () => {
>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7
    service.start();

    service.stop();

<<<<<<< HEAD
    window.dispatchEvent(new MouseEvent('mousemove'));
=======
    window.dispatchEvent(new Event('mousemove'));
>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(authService.logout).not.toHaveBeenCalled();
<<<<<<< HEAD
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
=======

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
>>>>>>> f55ccc2f809ba8dba61e0e0ee59fe6e6f8dc5ad7
  });
});
