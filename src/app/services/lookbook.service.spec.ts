import { TestBed } from '@angular/core/testing';
// Import the new standalone testing functions
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { LookbookService } from './lookbook.service';

describe('LookbookService', () => {
  let service: LookbookService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // Remove 'imports' entirely, and move everything to 'providers'
      providers: [LookbookService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LookbookService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch lookbook trends', () => {
    const mockResponse = { status: 'success', generated_article_html: '<h3>Test</h3>' };

    service.getLookbookTrends().subscribe((response) => {
      expect(response.status).toBe('success');
      expect(response.generated_article_html).toBe('<h3>Test</h3>');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/home/trends/lookbook');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
