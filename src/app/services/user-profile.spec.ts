import { TestBed } from '@angular/core/testing';

import { provideHttpClient } from '@angular/common/http';

import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { UserProfileService } from './user-profile';

import { UserProfile } from '../models/user-profile';

import { environment } from '../../environments/environment';

describe('UserProfileService', () => {
  let service: UserProfileService;

  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/user-profile`;

  // =========================================================
  // SETUP
  // =========================================================

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UserProfileService);

    httpMock = TestBed.inject(HttpTestingController);
  });

  // =========================================================
  // CLEANUP
  // =========================================================

  afterEach(() => {
    httpMock.verify();
  });

  // =========================================================
  // SERVICE CREATION
  // =========================================================

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // =========================================================
  // GET PROFILE
  // =========================================================

  describe('getProfile', () => {
    // =======================================================
    // SUCCESS
    // =======================================================

    it('should get user profile successfully', () => {
      const profile: UserProfile = {
        firstName: 'John',

        lastName: 'Tan',

        address: '12 Rainbow Street',

        phoneNumber: '91234567',
      };

      let actualResponse: UserProfile | undefined;

      service.getProfile().subscribe({
        next: (response) => {
          actualResponse = response;
        },

        error: (error) => {
          expect.fail(`Expected successful response but received error: ${error}`);
        },
      });

      const req = httpMock.expectOne(apiUrl);

      expect(req.request.method).toBe('GET');

      expect(req.request.url).toBe(apiUrl);

      req.flush(profile);

      expect(actualResponse).toEqual(profile);
    });

    // =======================================================
    // 404 ERROR
    // =======================================================

    it('should handle 404 error', () => {
      let actualError: any;

      service.getProfile().subscribe({
        next: () => {
          expect.fail('Expected request to fail');
        },

        error: (error) => {
          actualError = error;
        },
      });

      const req = httpMock.expectOne(apiUrl);

      expect(req.request.method).toBe('GET');

      req.flush(
        'User profile is not found',

        {
          status: 404,

          statusText: 'Not Found',
        },
      );

      expect(actualError).toBeTruthy();

      expect(actualError.status).toBe(404);
    });

    // =======================================================
    // 500 ERROR
    // =======================================================

    it('should handle 500 server error', () => {
      let actualError: any;

      service.getProfile().subscribe({
        next: () => {
          expect.fail('Expected request to fail');
        },

        error: (error) => {
          actualError = error;
        },
      });

      const req = httpMock.expectOne(apiUrl);

      expect(req.request.method).toBe('GET');

      req.flush(
        'Internal server error',

        {
          status: 500,

          statusText: 'Internal Server Error',
        },
      );

      expect(actualError).toBeTruthy();

      expect(actualError.status).toBe(500);
    });
  });
});
