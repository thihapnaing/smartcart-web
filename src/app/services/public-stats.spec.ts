import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PublicStatsService } from './public-stats';
import { environment } from '../../environments/environment';
import { PublicStats } from '../models/public-stats';

describe('PublicStatsService', () => {
  let service: PublicStatsService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PublicStatsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('getStats', () => {
    it('sends a GET to /public/stats and returns the response', () => {
      const fakeStats: PublicStats = { activeListings: 42, activeMerchants: 5, totalRevenue: 1234.56 };

      let result: PublicStats | undefined;
      service.getStats().subscribe((stats) => (result = stats));

      const request = httpTestingController.expectOne(`${environment.apiUrl}/public/stats`);
      expect(request.request.method).toBe('GET');
      request.flush(fakeStats);

      expect(result).toEqual(fakeStats);
    });
  });
});
