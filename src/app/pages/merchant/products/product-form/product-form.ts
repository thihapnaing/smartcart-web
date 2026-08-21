import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MerchantProductService } from '../../../../services/merchant-product-service';
import { CategoryService } from '../../../../services/category-service';
import { CategoryResponse } from '../../../../models/category-response';
import { ProductRequest } from '../../../../models/product-request';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css',
})
export class ProductForm implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(MerchantProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly fb = inject(FormBuilder);

  protected readonly productId = signal<number | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly categories = signal<CategoryResponse[]>([]);

  protected readonly isUploading = signal(false);
  protected readonly uploadError = signal<string | null>(null);

  protected readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    price: [null, [Validators.required, Validators.min(0.01)]],
    gender: ['MEN', Validators.required],
    categoryId: [null, Validators.required],
    status: ['ACTIVE', Validators.required],
    imageUrl: [''],
    color: [''],
    variants: this.fb.array([], Validators.required)
  });

  protected get variants(): FormArray {
    return this.form.get('variants') as FormArray;
  }

  protected addVariant(): void {
    this.variants.push(this.createVariantGroup());
  }

  protected removeVariant(index: number): void {
    this.variants.removeAt(index);
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if(!file) {
      return;
    }

    this.isUploading.set(true);
    this.uploadError.set(null);

    this.productService.uploadImage(file).subscribe({
      next: (response) => {
        this.form.patchValue({ imageUrl: response.imageUrl});
        this.isUploading.set(false);
      },
      error: (err) => {
        this.uploadError.set(err.error?.message ?? 'Image upload failed. Please try again.');
        this.isUploading.set(false);
      }
    });
  }

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe(categories => {
      this.categories.set(categories);
      const idParam = this.route.snapshot.paramMap.get('id');
      if (idParam) {
        const id = Number(idParam);
        this.productId.set(id);
        this.isEditMode.set(true);
        this.loadExistingProduct(id);
      } else {
        this.addVariant();
      }
    });
  }

  private createVariantGroup(size: string = '', stock: number | null = null): FormGroup {
    return this.fb.group({
      size: [size, Validators.required],
      stock: [stock, [Validators.required, Validators.min(0)]]
    })
  }

  private loadExistingProduct(id: number): void {
    this.productService.getProductDetail(id).subscribe(product => {
      const matchingCategory = this.categories().find(c => c.name === product.categoryName);

      this.form.patchValue({
        name: product.name,
        description: product.description,
        price: product.price,
        gender: product.gender,
        status: product.status,
        imageUrl: product.imageUrl,
        color: product.color,
        categoryId: matchingCategory ? matchingCategory.id : null
      });

      this.variants.clear();
      for (const variant of product.variants) {
        this.variants.push(this.createVariantGroup(variant.size, variant.stock));
      }
    });
  }

  protected onSubmit(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const request: ProductRequest = {
    name: this.form.value.name,
    description: this.form.value.description,
    price: this.form.value.price,
    gender: this.form.value.gender,
    categoryId: this.form.value.categoryId,
    status: this.form.value.status,
    imageUrl: this.form.value.imageUrl,
    color: this.form.value.color,
    variants: this.form.value.variants
  };

  if (this.isEditMode()) {
    this.productService.updateProduct(this.productId()!, request).subscribe({
      next: () => this.router.navigate(['/merchant/products']),
      error: (err) => this.uploadError.set(err.error?.message ?? 'Failed to update product.')
    });
  } else {
    this.productService.createProduct(request).subscribe({
      next: () => this.router.navigate(['/merchant/products']),
      error: (err) => this.uploadError.set(err.error?.message ?? 'Failed to create product.')
    });
  }
}
}
