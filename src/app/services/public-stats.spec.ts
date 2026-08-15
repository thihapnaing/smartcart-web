import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { PublicStatsService } from './public-stats';
import { PublicStats } from '../models/public-stats';
import { environment } from '../../environments/environment';

describe('PublicStatsService', () => {
  let service: PublicStatsService;
  let httpMock: HttpTestingController;

  // Built the same way the service itself builds it, so this stays correct
  // even if environment.apiUrl changes later
  const apiBase = `${environment.apiUrl}/public`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PublicStatsService, provideHttpClient(), provideHttpClientTesting()],
    });

    // Creating the service here also runs its constructor,
    // which is one of the two functions this file needs covered
    service = TestBed.inject(PublicStatsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Confirms no requests were made that the test did not expect
    httpMock.verify();
  });

  describe('getStats', () => {
    it('sends a GET request to the public stats endpoint', () => {
      service.getStats().subscribe();

      const req = httpMock.expectOne(`${apiBase}/stats`);
      expect(req.request.method).toBe('GET');

      req.flush({} as PublicStats);
    });

    it('returns the stats data received from the backend', () => {
      const fakeStats = {} as PublicStats;
      let receivedStats: PublicStats | undefined;

      service.getStats().subscribe((stats) => {
        receivedStats = stats;
      });

      const req = httpMock.expectOne(`${apiBase}/stats`);
      req.flush(fakeStats);

      expect(receivedStats).toEqual(fakeStats);
    });
  });
});