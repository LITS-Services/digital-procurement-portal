import { ChangeDetectorRef, Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { RfqService } from '../rfq.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-rfq-final-vendors',
  templateUrl: './rfq-final-vendors.component.html',
  styleUrls: ['./rfq-final-vendors.component.scss']
})
export class RfqFinalVendorsComponent implements OnInit {

  @Input() data:any;

  itemsData:any[] = [];
  vendorData:any[] = [];
  selected: { [id: number]: { vendorCompanyId: string; vendorId: string } | null } = {};
  quotationRequestId: number | null = null;


    constructor(private rfqService: RfqService, private toastr:ToastrService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    //this.loadItems();
  }

    ngOnChanges(changes: SimpleChanges): void {
      if (changes['data'] && changes['data'].currentValue) {
        this.quotationRequestId = this.data.quotationId;
        this.loadItems(this.quotationRequestId);
      }
    }

  loadItems(quotationRequestId?: number) {
    this.rfqService.getItemsQuotationById(this.quotationRequestId).subscribe({
        next: (res: any) => {
          this.itemsData = res.items
          this.vendorData = res.selectedVendors
           this.itemsData.forEach((item: any) => {
        // Try to find the exact vendor object from vendorData by IDs
            const pre =
              item.vendorCompanyId && (item.vendorUserId || item.vendorId)
                ? this.vendorData.find((v: any) =>
                    v.vendorCompanyId === item.vendorCompanyId &&
                    ((v.vendorUserId ?? v.vendorId) === (item.vendorUserId ?? item.vendorId))
                  )
                : null;

            this.selected[item.id] = pre ?? null;
          });

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching vendors', err);
        }
      });
  }


onSubmit() {
  const payload = this.itemsData
    .map(row => {
      const sel = this.selected[row.id];
      if (!sel) return null;

      return {
        quotationItemId: row.id,                  // from your item shape
        vendorUserId: sel.vendorId,           // picked from dropdown object
        vendorCompanyId: sel.vendorCompanyId      // picked from dropdown object
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
