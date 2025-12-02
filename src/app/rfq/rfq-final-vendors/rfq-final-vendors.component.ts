import { ChangeDetectorRef, Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { RfqService } from '../rfq.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-rfq-final-vendors',
  templateUrl: './rfq-final-vendors.component.html',
  styleUrls: ['./rfq-final-vendors.component.scss']
})
export class RfqFinalVendorsComponent implements OnInit {

  @Input() data: any;
  @Input() viewMode: boolean = false;

  itemsData: any[] = [];
  vendorData: any[] = [];
  //selected: { [id: number]: { companyId: string; vendorUserId: string } | null } = {};
  selected: { [id: number]: any | null } = {};
  quotationRequestId: number | null = null;

  constructor(private rfqService: RfqService, private toastr: ToastrService, private cdr: ChangeDetectorRef) { }

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

    this.rfqService.postFinalVendors({ selectFinalVendorForQuotationItem: payload })
      .subscribe({
        next: () => this.loadItems(this.quotationRequestId),
        error: (e) => console.error(e)
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
}