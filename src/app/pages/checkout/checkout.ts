import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { OrderService } from '../../services/order';
import { CheckoutRequest } from '../../models/checkout-request';
import { CartItemsResponse } from '../../models/cart-items-response';
import { CartService } from '../../services/cart';
import { UserProfileService } from '../../user-profile';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly orderService = inject(OrderService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly userProfileService = inject(UserProfileService);

  cart = signal<CartItemsResponse | null>(null);

  checkoutForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    shippingAddress: ['', Validators.required],
    phoneNumber: ['', Validators.required],
    paymentMethod: ['', Validators.required],
    cardNumber: ['4242 4242 4242 4242'],
    expiry: ['08/28'],
    cvv: ['123']
  });

  ngOnInit(): void {
    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cart.set(response);
      },
      error: (err) => {
        console.error('Failed to load cart', err);
      }
    });

    this.userProfileService.getProfile().subscribe({
      next: (profile) => {
        this.checkoutForm.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          shippingAddress: profile.address,
          phoneNumber: profile.phoneNumber
        });
      },
      error: (err) => {
        console.error('Failed to load profile', err);
      }
    });
  }

  selectPaymentMethod(method: 'CREDIT_CARD' | 'PAY_NOW') {
      this.checkoutForm.patchValue({paymentMethod: method});
    }

  onSubmit() {
    if(this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }
    const formValue = this.checkoutForm.value;
    const request: CheckoutRequest = {
      firstName: formValue.firstName!,
      lastName: formValue.lastName!,
      shippingAddress: formValue.shippingAddress!,
      phoneNumber: formValue.phoneNumber!,
      paymentMethod: formValue.paymentMethod as any
    };

    this.orderService.checkout(request).subscribe({
      next: (response) => {
        this.router.navigate([`/order-confirmation/${response.orderId}`]);
      },
      error: (err) => {
        console.error('Checkout failed', err);
      }
    });
  }
}
