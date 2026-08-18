import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

// Author: Junior

@Injectable({
  providedIn: 'root',
})
export class IdleTimeoutService {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // =========================================================
  // CONFIGURATION
  // =========================================================

  private readonly idleTimeout = 5 * 60 * 1000; // 5 minutes

  private idleTimer: ReturnType<typeof setTimeout> | null = null;

  private started = false;

  private readonly events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

  // =========================================================
  // START
  // =========================================================

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;

    this.events.forEach((event) => {
      window.addEventListener(event, this.handleActivity, true);
    });

    this.resetTimer();
  }

  // =========================================================
  // STOP
  // =========================================================

  stop(): void {
    if (!this.started) {
      return;
    }

    this.started = false;

    this.events.forEach((event) => {
      window.removeEventListener(event, this.handleActivity, true);
    });

    this.clearTimer();
  }

  // =========================================================
  // USER ACTIVITY
  // =========================================================

  private handleActivity = (): void => {
    this.resetTimer();
  };

  // =========================================================
  // RESET TIMER
  // =========================================================

  private resetTimer(): void {
    this.clearTimer();

    this.idleTimer = setTimeout(() => this.handleIdleTimeout(), this.idleTimeout);
  }

  // =========================================================
  // CLEAR TIMER
  // =========================================================

  private clearTimer(): void {
    if (this.idleTimer !== null) {
      clearTimeout(this.idleTimer);

      this.idleTimer = null;
    }
  }

  // =========================================================
  // IDLE TIMEOUT
  // =========================================================

  private handleIdleTimeout(): void {
    this.clearTimer();

    this.stop();

    this.authService.logout();

    this.router.navigate(['/login']);
  }
}
