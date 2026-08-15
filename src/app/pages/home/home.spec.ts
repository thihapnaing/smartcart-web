// Missing Angular testing imports
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

// Import your component and service
import { Home } from './home';
import { LookbookService } from '../../services/lookbook.service';

// The 'describe' wrapper groups all tests for this component
describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home], // Assuming Home is a standalone component
      providers: [
        // NOTE: If your Home component uses other services (like ProductService),
        // you will need to add mock providers for them here too!
        provideRouter([]),

        {
          provide: LookbookService,
          useValue: {
            getLookbookTrends: () =>
              of({
                status: 'success',
                generated_article_html: '<h3>Mock Lookbook</h3>',
              }),
          },
        },
      ],
    }).compileComponents();

    // Create the component instance
    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
  });

  // Your actual test case
  it('should load AI lookbook trends into the signal on init', () => {
    // Trigger ngOnInit
    fixture.detectChanges();

    // Verify the signal was updated with the mocked HTML
    expect(component.lookbookHtml()).toBe('<h3>Mock Lookbook</h3>');
  });
});
