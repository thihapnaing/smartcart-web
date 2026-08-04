import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { OrderService } from '../../services/order';
import { CheckoutRequest } from '../../models/checkout-request';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutComponent {
  private fb = inject(FormBuilder);
  private orderService = inject(OrderService);
  private router = inject(Router);

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
