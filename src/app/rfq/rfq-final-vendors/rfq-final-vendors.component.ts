import { ChangeDetectorRef, Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { RfqService } from '../rfq.service';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-rfq-final-vendors',
  templateUrl: './rfq-final-vendors.component.html',
  styleUrls: ['./rfq-final-vendors.component.scss'],
  standalone: false
})
export class RfqFinalVendorsComponent implements OnInit {

  @Input() data: any;
  @Input() viewMode: boolean = false;

  itemsData: any[] = [];
  vendorData: any[] = [];
  //selected: { [id: number]: { companyId: string; vendorUserId: string } | null } = {};
  selected: { [id: number]: any | null } = {};
  quotationRequestId: number | null = null;

  loadingAi = false;
  aiExplanation: string = '';

  constructor(private rfqService: RfqService, private toastr: ToastrService, private cdr: ChangeDetectorRef,
    private modalService: NgbModal,
  ) { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue) {
      this.quotationRequestId = this.data.quotationId;
      this.loadItems(this.quotationRequestId);
      this.loadBiddingVendors(this.quotationRequestId);
    }
  }

  loadItems(quotationRequestId?: number) {
    if (!quotationRequestId) return;

    this.rfqService.getItemsQuotationById(quotationRequestId).subscribe({
      next: (res: any) => {
        this.itemsData = res.items || [];

        // Initialize selected mapping
        this.itemsData.forEach(item => {
          this.selected[item.id] = null;
        });
        this.mapSelectedVendors();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching items', err);
      }
    });
  }

  loadBiddingVendors(quotationRequestId?: number) {
    if (!quotationRequestId) return;

    this.rfqService.getBidSubmissionDetailsByQuotation(quotationRequestId).subscribe({
      next: (res: any) => {
        // Only vendors who actually submitted bids
        this.vendorData = (res.vendors || []).filter(v => v.bids && v.bids.length > 0);
        this.mapSelectedVendors();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching bidding vendors', err);
      }
    });
  }
  // private mapSelectedVendors() {
  //   if (!this.itemsData.length || !this.vendorData.length) return;

  //   this.itemsData.forEach(item => {
  //     const pre =
  //       item.vendorCompanyId && (item.vendorUserId || item.vendorId)
  //         ? this.vendorData.find(v =>
  //           v.companyId === item.vendorCompanyId &&
  //           v.vendorUserId === (item.vendorUserId ?? item.vendorId)
  //         )
  //         : null;

  //     this.selected[item.id] = pre ?? null;
  //   });

  //   this.cdr.detectChanges();
  // }
  private mapSelectedVendors() {
    if (!this.itemsData.length || !this.vendorData.length) return;

    this.itemsData.forEach(item => {
      const vendor = this.vendorData.find(v =>
        v.companyId === item.vendorCompanyId &&
        v.vendorUserId === (item.vendorUserId ?? item.vendorId)
      );

      this.selected[item.id] = vendor ?? null;  // <-- store the full vendor object
    });

    this.cdr.detectChanges();
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

    // Optional loading state
    Swal.fire({
      title: 'Processing...',
      text: 'Finalizing vendor selection',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });


    this.rfqService.postFinalVendors({ selectFinalVendorForQuotationItem: payload })
      .subscribe({
        next: () =>
          {
            Swal.fire({
            icon: 'success',
            title: 'Vendors Finalized',
            text: 'Selected vendor(s) have been successfully finalized.',
            timer: 2000,
            showConfirmButton: false
          });
            this.loadItems(this.quotationRequestId); },
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

    const bid = vendor.bids.find(b => b.quotationItemId === itemId);
    return bid?.biddingAmount ?? null;
  }

  get itemsWithTotals() {
    if (!this.itemsData.length) return [];

    const totalBudget = this.itemsData.reduce((sum, i) => sum + (i.amount || 0), 0);

    const totalQuote = this.itemsData.reduce((sum, i) => {
      const vendor = this.selected[i.id];
      if (!vendor?.bids) return sum;

      const bid = vendor.bids.find((b: any) => b.quotationItemId === i.id);
      return sum + (bid?.biddingAmount || 0);
    }, 0);

    const difference = totalBudget - totalQuote;

    return [
      ...this.itemsData,
      {
        id: -1,
        itemName: 'Total',
        amount: totalBudget,
        quoteAmount: totalQuote,
        difference
      }
    ];
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

        // open modal after getting response
        this.modalService.open(modalRef, { size: 'sm', centered: true });
      },
      error: (err) => {
        console.error('AI request failed', err);
        this.toastr.error('Failed to get AI recommendation.');
        this.loadingAi = false;
      }
    });
  }

  // Item-level: is this item already finalized?
  isItemFinalized(item: any): boolean {
    return !!(item.vendorCompanyId && (item.vendorUserId || item.vendorId));
  }

  // Global: are ALL items finalized?
  get allItemsFinalized(): boolean {
    return (
      this.itemsData.length > 0 &&
      this.itemsData.every(item => this.isItemFinalized(item))
    );
  }

  // Global: is ANY item still pending?
  get hasPendingItems(): boolean {
    return this.itemsData.some(item => !this.isItemFinalized(item));
  }

}