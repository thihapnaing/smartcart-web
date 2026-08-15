import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminMerchantService } from './admin-merchant';
import { environment } from '../../../environments/environment';
import { AdminMerchantDetail, AdminMerchantSummary } from '../models/admin-merchant-summary';

describe('AdminMerchantService', () => {
  let service: AdminMerchantService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AdminMerchantService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('getAllMerchants() sends a GET to /admin/merchants and returns the response', () => {
    const fakeMerchants: AdminMerchantSummary[] = [];
    let actualMerchants: AdminMerchantSummary[] | undefined;

    service.getAllMerchants().subscribe((merchants) => {
      actualMerchants = merchants;
    });

    const request = httpTestingController.expectOne(`${environment.apiUrl}/admin/merchants`);
    expect(request.request.method).toBe('GET');

    request.flush(fakeMerchants);

    expect(actualMerchants).toEqual(fakeMerchants);
  });

  it('getMerchantDetail() sends a GET to /admin/merchants/:id and returns the response', () => {
    const fakeDetail = {} as AdminMerchantDetail;
    let actualDetail: AdminMerchantDetail | undefined;

    service.getMerchantDetail(7).subscribe((detail) => {
      actualDetail = detail;
    });

    const request = httpTestingController.expectOne(`${environment.apiUrl}/admin/merchants/7`);
    expect(request.request.method).toBe('GET');

    request.flush(fakeDetail);

    expect(actualDetail).toEqual(fakeDetail);
  });

  it('updateStatus() sends a PATCH with the new status to /admin/merchants/:id/status', () => {
    const fakeMerchant = {} as AdminMerchantSummary;
    let actualMerchant: AdminMerchantSummary | undefined;

    service.updateStatus(7, 'SUSPENDED').subscribe((merchant) => {
      actualMerchant = merchant;
    });

    const request = httpTestingController.expectOne(`${environment.apiUrl}/admin/merchants/7/status`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'SUSPENDED' });

    request.flush(fakeMerchant);

    expect(actualMerchant).toEqual(fakeMerchant);
  });
});
