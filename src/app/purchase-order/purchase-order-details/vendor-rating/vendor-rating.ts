import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-vendor-rating',
  templateUrl: './vendor-rating.html',
  styleUrl: './vendor-rating.scss',
  standalone: false
})
export class VendorRating {
  @Input() poId!: number; // Pass PO Id from parent tab
  ratingForm!: FormGroup;
  loading = true;
  saving = false;
  poDetails: any;

  ratingExists = false;
  existingRatingId?: number;

  constructor(
    private fb: FormBuilder,
    private poService: PurchaseOrderService,
    private cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.ratingForm = this.fb.group({
      purchaseOrderNo: [{ value: '', disabled: true }],
      vendorName: [{ value: '', disabled: true }],
      rating: [null, [Validators.required, Validators.min(0), Validators.max(5)]]
    });

    if (this.poId) {
      this.loadPoDetails();
      this.loadVendorRating();
    }
  }

  loadVendorRating() {
    this.loading = true;
    this.spinner.show();
    this.poService.getVendorRatingByPoId(this.poId)
      .subscribe({
        next: (res) => {
          if (res) {
            const rating = res;

            this.ratingExists = true;
            this.existingRatingId = rating.id;

            this.ratingForm.patchValue({
              rating: rating.rating
            });

            this.ratingForm.get('rating')?.disable();
            this.loading = false;
            this.spinner.hide();
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.ratingExists = false;
          this.ratingForm.get('rating')?.enable();
        }
      });
  }

  loadPoDetails() {
    this.loading = true;
    this.spinner.show();
    this.poService.getPurchaseOrderById(this.poId)
      .pipe(finalize(() => { this.loading = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: (res: any) => {
          this.poDetails = res;
          this.ratingForm.patchValue({
            purchaseOrderNo: res.purchaseOrderNo || '-',
            vendorName: res.vendorName || '-'
          });
          this.loading = false;
          this.spinner.hide();
        },
        error: () => {
          this.ratingForm.patchValue({ purchaseOrderNo: '-', vendorName: '-' });
        }
      });
  }

  // loadVendorRating() {
  //   this.ratingService.getVendorRatingByPoId(this.poId)
  //     .subscribe({
  //       next: (res: any) => {
  //         if (res && res.rating != null) {
  //           this.ratingForm.patchValue({ rating: res.rating });
  //         }
  //       },
  //       error: () => { }
  //     });
  // }

  submitRating() {
    if (this.ratingForm.invalid || this.ratingExists) return;

    this.saving = true;

    const payload = {
      purchaseOrderId: this.poId,
      vendorRating: {
        rating: this.ratingForm.value.rating
      }
    };

    this.poService.addVendorRating(payload)
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.ratingExists = true;
          this.ratingForm.get('rating')?.disable();
        },
        error: (err) => {
          console.error(err);
        }
      });
  }
}