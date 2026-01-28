import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { finalize } from 'rxjs';

export interface AvgVendorRatingVM {
  rating: number;
  avgRating: number;
  totalCount: number;
  comment?: string;
  createdBy?: string;
  createdDate?: Date; 
}

@Component({
  selector: 'app-vendor-rating',
  templateUrl: './vendor-rating.html',
  styleUrl: './vendor-rating.scss',
  standalone: false
})

export class VendorRating implements OnInit {
  @Input() poId!: number;
  @Input() vendorUserId!: string; // New input
  ratingData: AvgVendorRatingVM[] = [];
  loading = true;

  constructor(
    private poService: PurchaseOrderService,
    private cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    if (this.vendorUserId) {
      this.loadVendorRating();
    }
  }

  loadVendorRating() {
    this.loading = true;
    this.spinner.show();

    this.poService.avgVendorRating(this.vendorUserId)
      .pipe(finalize(() => {
        this.loading = false;
        this.spinner.hide();
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.ratingData = res;
        },
        error: (err) => console.error(err)
      });
  }

  getRatingCount(min: number, max: number): number {
    if (!this.ratingData.length) return 0;

    return this.ratingData.filter(r => {
      const rating = r.rating;
      if (rating === min && min !== 0) return false; // exact min goes to previous bucket
      return rating > min && rating <= max;
    }).length;
  }

  getStarFill(starNumber: number): number {
    const avg = this.avgRating || 0;

    if (avg >= starNumber) return 100;          // full star
    if (avg + 1 > starNumber) return (avg - (starNumber - 1)) * 100; // partial star
    return 0;                                  // empty star
  }

  // Max count for normalization (e.g., 5 latest ratings)
  get maxRatingCount(): number {
    return this.ratingData.length || 1;
  }

  getReviewStarFill(rating: number, starNumber: number): number {
  if (rating >= starNumber) return 100;                  // full star
  if (rating + 1 > starNumber) return (rating - (starNumber - 1)) * 100; // partial star
  return 0;                                           // empty star
}


  // Avg Rating display (all same, pick first)
  get avgRating(): number {
    return this.ratingData.length ? this.ratingData[0].avgRating : 0;
  }

  get totalCount(): number {
    return this.ratingData.length ? this.ratingData[0].totalCount : 0;
  }
}