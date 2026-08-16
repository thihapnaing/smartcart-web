import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminAccountService } from './admin-account';
import { environment } from '../../../environments/environment';
import { AdminAccount } from '../models/admin-account';

describe('AdminAccountService', () => {
  let service: AdminAccountService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AdminAccountService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('getAllAdmins() sends a GET to /admin/admins and returns the response', () => {
    const fakeAdmins: AdminAccount[] = [];
    let actualAdmins: AdminAccount[] | undefined;

    service.getAllAdmins().subscribe((admins) => {
      actualAdmins = admins;
    });

    const request = httpTestingController.expectOne(`${environment.apiUrl}/admin/admins`);
    expect(request.request.method).toBe('GET');

    request.flush(fakeAdmins);

    expect(actualAdmins).toEqual(fakeAdmins);
  });

  it('createAdmin() sends a POST with the username and email to /admin/admins', () => {
    const fakeAdmin = {} as AdminAccount;
    let actualAdmin: AdminAccount | undefined;

    service.createAdmin({ username: 'newadmin', email: 'newadmin@smartcart.demo' }).subscribe((admin) => {
      actualAdmin = admin;
    });

    const request = httpTestingController.expectOne(`${environment.apiUrl}/admin/admins`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ username: 'newadmin', email: 'newadmin@smartcart.demo' });

    request.flush(fakeAdmin);

    expect(actualAdmin).toEqual(fakeAdmin);
  });
});
