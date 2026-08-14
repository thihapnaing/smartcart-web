import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminDashboardService } from './admin-dashboard';
import { environment } from '../../../environments/environment';
import { AdminDashboardStats } from '../models/admin-dashboard-stats';

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(AdminDashboardService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('getStats() sends a GET to /admin/dashboard/stats and returns the response', () => {
    const fakeStats = {} as AdminDashboardStats;
    let actualStats: AdminDashboardStats | undefined;

    service.getStats().subscribe((stats) => {
      actualStats = stats;
    });

    const request = httpTestingController.expectOne(`${environment.apiUrl}/admin/dashboard/stats`);
    expect(request.request.method).toBe('GET');

    request.flush(fakeStats);

    expect(actualStats).toEqual(fakeStats);
  });
});
