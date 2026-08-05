import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { AlertService } from '../../services/alert.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';
import { CartItem } from '../../models/cart.model';
import { ProductCardComponent } from '../../components/product-card/product-card.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  styles: [`
    /* "container" already centers the page and sets max width (see styles.css) */
    .back-link {
      display: flex; align-items: center; gap: .4rem;
      font-size: .875rem; color: #8B6A4F; margin: 1.5rem 0 1.75rem;
      background: none; border: none; cursor: pointer; transition: opacity .2s ease;
    }
    .back-link:hover { opacity: .7; }

    /* Two columns on wide screens, one column (stacked) on narrow screens */
    .layout { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; margin-bottom: 3.5rem; }
    @media(max-width:768px) { .layout { grid-template-columns: 1fr; } }

    .img-box { border-radius: 18px; overflow: hidden; background: #E8D5C0; min-height: 460px; }
    .img-box img { width: 100%; height: 100%; object-fit: cover; max-height: 540px; }

    .title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; margin-bottom: .5rem; }
    .eyebrow { font-size: .625rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #8B6A4F; margin-bottom: .4rem; }
    .title { font-family: 'Playfair Display', serif; font-size: 1.875rem; font-weight: 600; color: #2C1A10; line-height: 1.2; }

    .stars { display: flex; align-items: center; gap: 3px; margin-top: .25rem; }
    .star { width: 15px; height: 15px; }
    .star.filled polygon { fill: #C9A47B; stroke: #C9A47B; }
    .star.empty polygon { fill: rgba(201,164,123,.15); stroke: rgba(201,164,123,.25); }
    .rev-count { font-size: .8125rem; color: #7A5C44; margin-left: .4rem; }

    .badge-pill {
      display: inline-flex; align-items: center; gap: .35rem; margin-top: .75rem;
      font-size: .75rem; font-weight: 600; padding: .3rem .75rem; border-radius: 999px;
      background: rgba(201,164,123,.13); color: #8B6A4F; width: fit-content;
    }

    .price { font-family: 'Playfair Display', serif; font-size: 1.75rem; font-weight: 600; color: #2C1A10; margin-top: 1rem; }
    .desc { font-size: .875rem; line-height: 1.7; color: #7A5C44; margin: 1rem 0 1.5rem; }

    .section-label { font-size: .625rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #8B6A4F; margin-bottom: .6rem; }

    .size-row { display: flex; gap: .5rem; flex-wrap: wrap; }
    .size-btn { width: 40px; height: 40px; border-radius: 10px; border: 1px solid rgba(201,164,123,.4); font-size: .875rem; font-weight: 600; color: #2C1A10; background: transparent; cursor: pointer; transition: all .2s ease; }
    .size-btn.active { background: #4A3226; border-color: #4A3226; color: #FAF6F1; }

    .qty-block { margin-bottom: 1.5rem; }
    .qty-row { display: flex; align-items: center; gap: .75rem; border: 1px solid rgba(201,164,123,.27); border-radius: 10px; width: fit-content; padding: .25rem; }
    .qty-step-btn { width: 28px; height: 28px; border-radius: 6px; background: none; border: none; color: #4A3226; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .qty-step-btn:hover { opacity: .6; }
    .qty-step-btn:disabled { opacity: .3; cursor: not-allowed; }
    .qty-value { width: 28px; text-align: center; font-weight: 600; font-size: .875rem; color: #2C1A10; }
    .stock-note { font-size: .75rem; color: #8B6A4F; margin-top: .4rem; }

    .action-row { display: flex; gap: .75rem; margin-bottom: .75rem; }
    .action-row .btn { flex: 1; }

    .alert-btn {
      width: 100%; padding: .7rem; border-radius: 12px; border: 1px solid rgba(201,164,123,.35);
      font-size: .875rem; font-weight: 500; color: #8B6A4F; background: transparent;
      display: flex; align-items: center; justify-content: center; gap: .5rem; cursor: pointer; transition: all .2s ease;
    }
    .alert-btn.active { background: rgba(46,107,62,.08); border-color: rgba(46,107,62,.35); color: #2e6b3e; }

    .shipping-note { font-size: .75rem; color: #8B6A4F; margin-top: 1rem; display: flex; align-items: center; gap: .4rem; }

    .related-heading { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 600; color: #2C1A10; margin-bottom: 1.25rem; }
    .related-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    @media(max-width:768px) { .related-grid { grid-template-columns: repeat(2, 1fr); } }
  `],
  template: `
    <div class="container" style="padding-bottom: 3rem;">

      @if (product(); as p) {

        <!-- "Back to <category>" link, sends the shopper back to the filtered category page -->
        <button class="back-link" (click)="goBack(p)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
          </svg>
          Back to {{ p.category }}
        </button>

        <div class="layout">

          <!-- Left column: product photo -->
          <div class="img-box">
            <img [src]="p.imageUrl" [alt]="p.name"/>
          </div>

          <!-- Right column: all product details -->
          <div>
            <div class="title-row">
              <div>
                <div class="eyebrow">{{ p.gender }} · {{ p.category }}</div>
                <h1 class="title">{{ p.name }}</h1>
              </div>
            </div>

            <!-- Star rating -->
            <div class="stars">
              @for (filled of stars(); track $index) {
                <svg class="star" [class.filled]="filled" [class.empty]="!filled" viewBox="0 0 24 24">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              }
              <span class="rev-count">{{ p.rating }} ({{ p.reviews }} reviews)</span>
            </div>

            <!-- Badge, e.g. "Rain-ready" — only shown when the product has one -->
            @if (p.badge) {
              <span class="badge-pill">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/>
                </svg>
                {{ p.badge }} — climate-friendly
              </span>
            }

            <div class="price">S\${{ p.price.toFixed(2) }}</div>
            <p class="desc">{{ p.description }}</p>

            <!-- Size picker, hidden for Accessories since those do not come in sizes -->
            @if (p.category !== 'Accessories') {
              <div style="margin-bottom: 1.25rem;">
                <div class="section-label">Size</div>
                <div class="size-row">
                  @for (s of sizes; track s) {
                    <button class="size-btn" [class.active]="selectedSize() === s" (click)="selectedSize.set(s)">{{ s }}</button>
                  }
                </div>
              </div>
            }

            <!-- Quantity stepper -->
            <div class="qty-block">
              <div class="section-label">Quantity</div>
              <div class="qty-row">
                <button class="qty-step-btn" [disabled]="qty() <= 1" (click)="qty.set(Math.max(1, qty() - 1))">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>
                </button>
                <span class="qty-value">{{ qty() }}</span>
                <button class="qty-step-btn" [disabled]="qty() >= p.stock" (click)="qty.set(Math.min(p.stock, qty() + 1))">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                </button>
              </div>
              <div class="stock-note">{{ p.stock }} in stock</div>
            </div>

            <!-- Add to cart / Buy now -->
            <div class="action-row">
              <button class="btn btn-primary btn-lg" (click)="addToCart(p)" [disabled]="adding()">
                {{ adding() ? 'Added to cart!' : (inCart() ? 'Already in cart' : 'Add to cart') }}
              </button>
              <button class="btn btn-secondary btn-lg" (click)="buyNow(p)">
                Buy now
              </button>
            </div>

            <!-- Price alert toggle -->
            <button class="alert-btn" [class.active]="alertSet()" (click)="toggleAlert(p)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>
              </svg>
              {{ alertSet() ? 'Price alert active — edit target' : 'Set price alert' }}
            </button>

            <div class="shipping-note">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/>
              </svg>
              Free shipping on orders above S$60
            </div>
          </div>
        </div>

        <!-- "You might also like" — related products from the same category and gender -->
        @if (related().length > 0) {
          <div>
            <h2 class="related-heading">You might also like</h2>
            <div class="related-grid">
              @for (rp of related(); track rp.id) {
                <app-product-card [product]="rp"/>
              }
            </div>
          </div>
        }

      } @else if (loading()) {
        <div style="text-align:center; padding: 4rem 0; color:#7A5C44;">Loading product...</div>
      }
    </div>
  `
})
export class ProductDetailComponent implements OnInit {
  // Math is used inside the template for the quantity +/- buttons
  protected readonly Math = Math;

  product = signal<Product | null>(null);
  loading = signal(true);
  related = signal<Product[]>([]);

  selectedSize = signal('M');
  qty = signal(1);
  adding = signal(false);
  alertSet = signal(false);

  sizes = ['XS', 'S', 'M', 'L', 'XL'];

  // True when the product currently on screen is already sitting in the cart
  inCart = computed(() => {
    const p = this.product();
    if (!p) return false;
    return this.cart.items().some((item: CartItem) => item.productId === p.id);
  });

  // Turns a 0–5 rating into an array of 5 true/false values for drawing stars
  stars = () => Array.from({ length: 5 }, (_, i) => i < Math.round(this.product()?.rating ?? 0));

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productService: ProductService,
    private readonly cart: CartService,
    private readonly alertService: AlertService
  ) {}

  ngOnInit() {
    // Angular re-uses this same component when navigating from one product
    // detail page to another (e.g. clicking a related product), so the route
    // parameters are watched instead of only read once in ngOnInit.
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.loadProduct(id);
    });
  }

  private loadProduct(id: number) {
    this.loading.set(true);
    this.selectedSize.set('M');
    this.qty.set(1);
    this.alertSet.set(false);

    this.productService.getById(id).subscribe({
      next: (p: Product) => {
        this.product.set(p);
        this.loading.set(false);
        this.loadRelated(p);
      },
      error: () => this.router.navigate(['/'])
    });
  }

  private loadRelated(p: Product) {
    this.productService.getAll({ category: p.category, gender: p.gender }).subscribe({
      next: (list: Product[]) => this.related.set(list.filter((item: Product) => item.id !== p.id).slice(0, 4)),
      error: () => this.related.set([])
    });
  }

  goBack(p: Product) {
    this.router.navigate(['/category'], { queryParams: { category: p.category } });
  }

  addToCart(p: Product) {
    this.adding.set(true);
    this.cart.add(p.id, this.selectedSize(), this.qty()).subscribe({
      next: () => setTimeout(() => this.adding.set(false), 1400),
      error: () => this.adding.set(false)
    });
  }

  buyNow(p: Product) {
    this.cart.add(p.id, this.selectedSize(), this.qty()).subscribe({
      next: () => this.router.navigate(['/checkout']),
      error: () => {}
    });
  }

  toggleAlert(p: Product) {
    if (this.alertSet()) {
      this.alertSet.set(false);
      return;
    }
    const target = p.price * 0.9;
    this.alertService.setAlert(p.id, target).subscribe();
    this.alertSet.set(true);
  }
}
