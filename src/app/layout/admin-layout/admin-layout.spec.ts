import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminLayout } from './admin-layout';

describe('AdminLayout', () => {
  let fixture: ComponentFixture<AdminLayout>;
  let component: AdminLayout;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLayout],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayout);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the admin bar and a router outlet', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-admin-bar')).toBeTruthy();
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
