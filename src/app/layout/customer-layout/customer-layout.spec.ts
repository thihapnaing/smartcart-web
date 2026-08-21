import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CustomerLayout } from './customer-layout';

describe('CustomerLayout', () => {
  let component: CustomerLayout;
  let fixture: ComponentFixture<CustomerLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerLayout],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});