import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SuggestionChips } from './suggestion-chips';

describe('SuggestionChips', () => {
  let fixture: ComponentFixture<SuggestionChips>;
  let component: SuggestionChips;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuggestionChips],
    }).compileComponents();

    fixture = TestBed.createComponent(SuggestionChips);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders no chips when suggestions is empty', () => {
    component.suggestions = [];
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button.chip');
    expect(buttons.length).toBe(0);
  });

  it('renders one button per suggestion', () => {
    component.suggestions = ['Outfit under $50', 'New arrivals'];
    fixture.detectChanges();

    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button.chip');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent?.trim()).toBe('Outfit under $50');
    expect(buttons[1].textContent?.trim()).toBe('New arrivals');
  });

  it('disables chip buttons when disabled is true', () => {
    component.suggestions = ['Outfit under $50'];
    component.disabled = true;
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button.chip');
    expect(button.disabled).toBe(true);
  });

  it('emits chipClicked with the suggestion text when a chip is clicked', () => {
    component.suggestions = ['Outfit under $50'];
    fixture.detectChanges();

    const emitted: string[] = [];
    component.chipClicked.subscribe((value) => emitted.push(value));

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button.chip');
    button.click();

    expect(emitted).toEqual(['Outfit under $50']);
  });
});
