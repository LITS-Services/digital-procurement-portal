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
  selected: { [id: number]: { companyId: string; vendorUserId: string } | null } = {};
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
  private mapSelectedVendors() {
    if (!this.itemsData.length || !this.vendorData.length) return;

    this.itemsData.forEach(item => {
      const pre =
        item.vendorCompanyId && (item.vendorUserId || item.vendorId)
          ? this.vendorData.find(v =>
            v.companyId === item.vendorCompanyId &&
            v.vendorUserId === (item.vendorUserId ?? item.vendorId)
          )
          : null;

      this.selected[item.id] = pre ?? null;
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
}