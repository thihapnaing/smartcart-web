import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AdminDashboard } from './admin-dashboard';
import { AdminDashboardService } from '../../services/admin-dashboard';
import { AdminDashboardStats } from '../../models/admin-dashboard-stats';

describe('AdminDashboard', () => {
  let fixture: ComponentFixture<AdminDashboard>;
  let component: AdminDashboard;
  let adminDashboardService: AdminDashboardService;

  const baseStats: AdminDashboardStats = {
    totalRevenue: 1000,
    activeListings: 10,
    inactiveListings: 2,
    newListingsThisWeek: 3,
    activeMerchants: 4,
    categoryBreakdown: [
      { categoryName: 'Tops', count: 5 },
      { categoryName: 'Shoes', count: 2 },
    ],
    genderSplit: [],
    recentListings: [],
  };

  const setup = () => {
    fixture = TestBed.createComponent(AdminDashboard);
    component = fixture.componentInstance;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboard],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    adminDashboardService = TestBed.inject(AdminDashboardService);
  });

  it('ngOnInit() loads stats and stops loading on success', () => {
    vi.spyOn(adminDashboardService, 'getStats').mockReturnValue(of(baseStats));
    setup();

    fixture.detectChanges();

    expect(component.stats()).toEqual(baseStats);
    expect(component.loading()).toBe(false);
  });

  it('ngOnInit() stops loading (without setting stats) when the request fails', () => {
    vi.spyOn(adminDashboardService, 'getStats').mockReturnValue(throwError(() => new Error('boom')));
    setup();

    fixture.detectChanges();

    expect(component.stats()).toBeNull();
    expect(component.loading()).toBe(false);
  });

  describe('platformHealthy', () => {
    it('is true before stats have loaded', () => {
      vi.spyOn(adminDashboardService, 'getStats').mockReturnValue(of(baseStats));
      setup();

      expect(component.platformHealthy()).toBe(true);
    });

    it.each([
      { description: 'there are no listings at all (avoids divide-by-zero)', activeListings: 0, inactiveListings: 0, expected: true },
      { description: 'inactive listings are under a third of the total', activeListings: 90, inactiveListings: 10, expected: true },
      { description: 'inactive listings are a third or more of the total', activeListings: 60, inactiveListings: 40, expected: false },
    ])('is $expected when $description', ({ activeListings, inactiveListings, expected }) => {
      vi.spyOn(adminDashboardService, 'getStats').mockReturnValue(of({ ...baseStats, activeListings, inactiveListings }));
      setup();
      fixture.detectChanges();

      expect(component.platformHealthy()).toBe(expected);
    });
  });

  describe('maxCategoryCount', () => {
    it.each([
      { description: 'defaults to 1 before stats have loaded', stats: baseStats, doDetect: false, expected: 1 },
      { description: 'defaults to 1 when the category breakdown is empty', stats: { ...baseStats, categoryBreakdown: [] }, doDetect: true, expected: 1 },
      { description: 'returns the highest count across categories', stats: baseStats, doDetect: true, expected: 5 },
    ])('$description', ({ stats, doDetect, expected }) => {
      vi.spyOn(adminDashboardService, 'getStats').mockReturnValue(of(stats));
      setup();
      if (doDetect) fixture.detectChanges();

      expect(component.maxCategoryCount()).toBe(expected);
    });
  });

  describe('genderLabel', () => {
    beforeEach(() => {
      vi.spyOn(adminDashboardService, 'getStats').mockReturnValue(of(baseStats));
      setup();
    });

    it.each([
      { gender: 'MEN', expected: "Men's" },
      { gender: 'WOMEN', expected: "Women's" },
      { gender: 'UNISEX', expected: 'UNISEX' },
    ])('maps $gender to $expected', ({ gender, expected }) => {
      expect(component.genderLabel(gender)).toBe(expected);
    });
  });

  describe('timeAgo', () => {
    beforeEach(() => {
      vi.spyOn(adminDashboardService, 'getStats').mockReturnValue(of(baseStats));
      setup();
    });

    it.each([
      { description: 'under a minute old', msAgo: 30 * 1000, expected: 'just now' },
      { description: 'under an hour old', msAgo: 15 * 60 * 1000, expected: '15m ago' },
      { description: 'under a day old', msAgo: 3 * 60 * 60 * 1000, expected: '3h ago' },
      { description: 'a day or older', msAgo: 2 * 24 * 60 * 60 * 1000, expected: '2d ago' },
    ])('returns "$expected" for timestamps $description', ({ msAgo, expected }) => {
      const isoDate = new Date(Date.now() - msAgo).toISOString();

      expect(component.timeAgo(isoDate)).toBe(expected);
    });
  });

  // baseStats always uses empty recentListings/genderSplit, so every test above renders only
  // the "no listings yet" / empty gender-tiles branches of the template - the @for loops over
  // actual recent-listing rows and gender tiles (with their ACTIVE/INACTIVE status classes)
  // never execute. These tests render real, non-empty data so those branches are covered too.
  describe('template rendering with populated data', () => {
    const populatedStats: AdminDashboardStats = {
      ...baseStats,
      genderSplit: [
        { gender: 'MEN', count: 6, percentage: 60 },
        { gender: 'WOMEN', count: 4, percentage: 40 },
      ],
      recentListings: [
        {
          id: 1,
          name: 'Blue Tee',
          price: 15,
          imageUrl: 'tee.jpg',
          categoryName: 'Tops',
          shopName: 'ShopA',
          gender: 'MEN',
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - 60 * 1000).toISOString(),
          merchantId: 10,
        },
        {
          id: 2,
          name: 'Red Dress',
          price: 40,
          imageUrl: 'dress.jpg',
          categoryName: 'Dresses',
          shopName: 'ShopB',
          gender: 'WOMEN',
          status: 'INACTIVE',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          merchantId: 20,
        },
      ],
    };

    it('renders a row per recent listing with the right status class, and a tile per gender', () => {
      vi.spyOn(adminDashboardService, 'getStats').mockReturnValue(of(populatedStats));
      setup();
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('.activity-row');
      expect(rows.length).toBe(2);
      expect(rows[0].textContent).toContain('Blue Tee');
      expect(rows[0].querySelector('.status-badge').classList.contains('status-badge--active')).toBe(true);
      expect(rows[1].textContent).toContain('Red Dress');
      expect(rows[1].querySelector('.status-badge').classList.contains('status-badge--inactive')).toBe(true);
      expect(fixture.nativeElement.querySelector('.recent-activity .status-text')).toBeNull();

      const tiles = fixture.nativeElement.querySelectorAll('.gender-tile');
      expect(tiles.length).toBe(2);
      expect(tiles[0].classList.contains('gender-tile--men')).toBe(true);
      expect(tiles[0].textContent).toContain("Men's");
      expect(tiles[1].classList.contains('gender-tile--women')).toBe(true);
      expect(tiles[1].textContent).toContain("Women's");
    });

    it('shows "Needs attention" styling when the platform is unhealthy', () => {
      vi.spyOn(adminDashboardService, 'getStats').mockReturnValue(
        of({ ...populatedStats, activeListings: 60, inactiveListings: 40 })
      );
      setup();
      fixture.detectChanges();

      const healthSpan = fixture.nativeElement.querySelector('.subtitle span');
      expect(healthSpan.classList.contains('status-warn')).toBe(true);
      expect(healthSpan.textContent).toContain('Needs attention');
    });
  });
});
