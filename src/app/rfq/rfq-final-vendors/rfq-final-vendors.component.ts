import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { RfqService } from '../rfq.service';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { catchError, finalize, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-rfq-final-vendors',
  templateUrl: './rfq-final-vendors.component.html',
  styleUrls: ['./rfq-final-vendors.component.scss'],
  standalone: false
})
export class RfqFinalVendorsComponent implements OnChanges {
  @Output() allItemsFinalizedChange = new EventEmitter<boolean>();
  @Input() data: any;
  @Input() viewMode: boolean = false;

  itemsData: any[] = [];
  vendorData: any[] = [];
  itemsWithTotals: any[] = [];
  selected: { [id: number]: any | null } = {};
  quotationRequestId: number | null = null;

  loadingAi = false;
  aiExplanation: string = '';
  loading = false;
  allItemsFinalized = false;

  constructor(
    private rfqService: RfqService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']?.currentValue) {
      this.quotationRequestId = this.data?.quotationId ?? null;
      this.loadData();
    }
  }

  private loadData(): void {
    if (!this.quotationRequestId) {
      this.resetData();
      return;
    }

    this.loading = true;

    forkJoin({
      items: this.rfqService.getItemsQuotationById(this.quotationRequestId).pipe(
        catchError((err) => {
          console.error('Error fetching items', err);
          return of({ items: [] });
        })
      ),
      vendors: this.rfqService.getBidSubmissionDetailsByQuotation(this.quotationRequestId).pipe(
        catchError((err) => {
          console.error('Error fetching bidding vendors', err);
          return of({ vendors: [] });
        })
      )
    }).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe(({ items, vendors }) => {
      this.itemsData = items?.items || [];
      this.vendorData = (vendors?.vendors || []).filter((v: any) => v.bids && v.bids.length > 0);

      this.selected = {};
      this.itemsData.forEach(item => {
        this.selected[item.id] = null;
      });

      this.mapSelectedVendors();
      this.updateItemsWithTotals();
      this.updateFinalizationState();
      this.cdr.detectChanges();
    });
  }

  private resetData(): void {
    this.itemsData = [];
    this.vendorData = [];
    this.selected = {};
    this.itemsWithTotals = [];
    this.updateFinalizationState();
    this.loading = false;
  }

  private mapSelectedVendors(): void {
    if (!this.itemsData.length || !this.vendorData.length) return;

    this.itemsData.forEach(item => {
      const vendor = this.vendorData.find(v =>
        v.companyId === item.vendorCompanyId &&
        v.vendorUserId === (item.vendorUserId ?? item.vendorId)
      );

      this.selected[item.id] = vendor ?? null;
    });
  }

  private updateItemsWithTotals(): void {
    if (!this.itemsData.length) {
      this.itemsWithTotals = [];
      return;
    }

    const totalBudget = this.itemsData.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalQuote = this.itemsData.reduce((sum, i) => {
      const vendor = this.selected[i.id];
      if (!vendor?.bids) return sum;

      const bid = vendor.bids.find((b: any) => b.quotationItemId === i.id);
      return sum + (bid?.biddingAmount || 0);
    }, 0);

    this.itemsWithTotals = [
      ...this.itemsData,
      {
        id: -1,
        itemName: 'Total',
        amount: totalBudget,
        quoteAmount: totalQuote,
        difference: totalBudget - totalQuote
      }
    ];
  }

  private updateFinalizationState(): void {
    const finalized = this.itemsData.length > 0 &&
      this.itemsData.every(item => this.isItemFinalized(item));

    if (finalized !== this.allItemsFinalized) {
      this.allItemsFinalized = finalized;
      this.allItemsFinalizedChange.emit(finalized);
    }
  }

  onSubmit() {
    const payload = this.itemsData
      .map(row => {
        const sel = this.selected[row.id];
        if (!sel) return null;
        return {
          quotationItemId: row.id,
          vendorUserId: sel.vendorUserId,
          vendorCompanyId: sel.companyId
        };
      })
      .filter(Boolean) as Array<{
        quotationItemId: number;
        vendorUserId: string;
        vendorCompanyId: string;
      }>;

    if (!payload.length) {
      this.toastr.warning('Please select at least one vendor.');
      return;
    }

    Swal.fire({
      title: 'Confirm Vendor Selection',
      text: 'Are you sure you want to finalize the selected vendor(s)? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, finalize',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.loading = true;
      this.rfqService.postFinalVendors({ selectFinalVendorForQuotationItem: payload })
        .pipe(finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }))
        .subscribe({
          next: () => {
            this.loadData();
          },
          error: (e) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to finalize vendors. Please try again.'
            });
            console.error(e);
          }
        });
    });
  }

  getQuoteAmount(itemId: number): number | null {
    const vendor = this.selected[itemId];
    if (!vendor?.bids) return null;

    const bid = vendor.bids.find((b: any) => b.quotationItemId === itemId);
    return bid?.biddingAmount ?? null;
  }

  onVendorSelectionChange(itemId: number, vendor: any): void {
    this.selected[itemId] = vendor;
    this.updateItemsWithTotals();
    this.cdr.detectChanges();
  }

  askAi(modalRef: any) {
    if (!this.data.quotationId) {
      this.toastr.warning('Quotation ID not available.');
      return;
    }

    this.loadingAi = true;
    this.aiExplanation = '';

    const payload = { rfqId: this.data.quotationId };

    this.rfqService.askAiVendorComparison(payload).subscribe({
      next: (res: any) => {
        this.aiExplanation = res.explanation || 'No explanation returned.';
        this.loadingAi = false;
        this.modalService.open(modalRef, { size: 'sm', centered: true });
      },
      error: (err) => {
        console.error('AI request failed', err);
        this.toastr.error('Failed to get AI recommendation.');
        this.loadingAi = false;
      }
    });
  }

  isItemFinalized(item: any): boolean {
    return !!(item.vendorCompanyId && (item.vendorUserId || item.vendorId));
  }

  get hasPendingItems(): boolean {
    return this.itemsData.some(item => !this.isItemFinalized(item));
  }
}
