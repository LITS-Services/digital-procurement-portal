import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { RfqService } from '../rfq.service';

@Component({
  selector: 'app-vendor-comparision',
  templateUrl: './vendor-comparision.component.html',
  styleUrls: ['./vendor-comparision.component.scss']
})
export class VendorComparisionComponent implements OnInit {

  @Input() data: any; // row passed from parent
  @Input() quotationRequestId!: number; // actual ID used for API

  @ViewChild(DatatableComponent) table!: DatatableComponent;
  @ViewChild('tableRowDetails') tableRowDetails: any;
  @ViewChild('tableResponsive') tableResponsive: any;

  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  vendorComparisonList: any[] = [];
  loading = true;
  columns = [];

  vendors: any[] = [];
selectedVendorId: string | null = null;
selectedItemCode: string | null = null;
filteredVendorComparisonList: any[] = [];


  constructor(
    public activeModal: NgbActiveModal,
    private rfqService: RfqService
  ) {}

ngOnInit(): void {
  this.filteredVendorComparisonList = this.vendorComparisonList;

 if (this.data && this.data.quotationId) {
      this.loadVendorComparison(this.data.quotationId); // load bids for given quotationRequestId
    }
}


// loadVendorComparison(quotationRequestId: number): void {
//   this.rfqService.getVendorComparison(quotationRequestId).subscribe({
//     next: (res) => {
//       // ✅ Fix: use res.items.$values
//       const items = res?.items?.$values || [];

//       this.vendorComparisonList = items.map((item: any) => ({
//         itemCode: item.itemCode,
//         itemDescription: item.itemDescription,
//         vendorComparisonBid: (item.vendorComparisonBid?.$values || []).map((bid: any) => ({
//           vendorUserId: bid.vendorUserId,
//           vendorName: bid.vendorName,
//           comment: bid.comment,
//           biddingAmount: bid.biddingAmount
//         }))
//       }));

//       console.log('Normalized Vendor Comparison:', this.vendorComparisonList); // 👀 Clean JSON
//       this.loading = false;
//     },
//     error: (err) => {
//       console.error('Error loading vendor comparison', err);
//       this.loading = false;
//     }
//   });
// }


// loadVendorComparison(quotationRequestId: number): void {
//   this.rfqService.getVendorComparison(quotationRequestId).subscribe({
//     next: (res) => {
//       const items = res?.items || [];
//       this.vendorComparisonList = items.map((item: any) => ({
//         itemCode: item.itemCode,
//         itemDescription: item.itemDescription,
//         vendorComparisonBid: item.vendorComparisonBid || []
//       }));
//       this.loading = false;
//     },
//     error: (err) => {
//       console.error('Error loading vendor comparison', err);
//       this.loading = false;
//     }
//   });
// }

// loadVendorComparison(quotationRequestId: number): void {
//   this.rfqService.getVendorComparison(quotationRequestId).subscribe({
//     next: (res) => {
//       const items = res?.items?.$values || [];

//       this.vendorComparisonList = items.map((item: any) => ({
//         itemCode: item.itemCode,
//         itemDescription: item.itemDescription,
//         vendorComparisonBid: (item.vendorComparisonBid?.$values || []).map((bid: any) => ({
//           vendorUserId: bid.vendorUserId,
//           vendorName: bid.vendorName,
//           comment: bid.comment,
//           biddingAmount: bid.biddingAmount
//         }))
//       }));

//       // ✅ Build unique vendors for dropdown
//       const vendorMap = new Map<string, string>();
//       this.vendorComparisonList.forEach(item => {
//         item.vendorComparisonBid.forEach((bid: any) => {
//           if (bid.vendorUserId && !vendorMap.has(bid.vendorUserId)) {
//             vendorMap.set(bid.vendorUserId, bid.vendorName);
//           }
//         });
//       });

//       this.vendors = Array.from(vendorMap, ([vendorUserId, vendorName]) => ({
//         vendorUserId,
//         vendorName
//       }));

//       console.log('Unique Vendors:', this.vendors);
//       this.loading = false;
//     },
//     error: (err) => {
//       console.error('Error loading vendor comparison', err);
//       this.loading = false;
//     }
//   });
// }

loadVendorComparison(quotationRequestId: number): void {
  this.rfqService.getVendorComparison(quotationRequestId).subscribe({
    next: (res) => {
      const items = res?.items?.$values || [];

      this.vendorComparisonList = items.map((item: any) => ({
        itemCode: item.itemCode,
        itemDescription: item.itemDescription,
        vendorComparisonBid: (item.vendorComparisonBid?.$values || []).map((bid: any) => ({
          vendorUserId: bid.vendorUserId,
          vendorName: bid.vendorName,
          comment: bid.comment,
          biddingAmount: bid.biddingAmount
        }))
      }));
this.filteredVendorComparisonList = [...this.vendorComparisonList];

      // ✅ unique vendors for dropdown
      const vendorMap = new Map<string, string>();
      this.vendorComparisonList.forEach(item => {
        item.vendorComparisonBid.forEach((bid: any) => {
          if (bid.vendorUserId && !vendorMap.has(bid.vendorUserId)) {
            vendorMap.set(bid.vendorUserId, bid.vendorName);
          }
        });
      });

      this.vendors = Array.from(vendorMap, ([vendorUserId, vendorName]) => ({
        vendorUserId,
        vendorName
      }));
      // initially show all vendors
      this.applyVendorItemFilter();
      this.loading = false;
    },
    error: (err) => {
      console.error('Error loading vendor comparison', err);
      this.loading = false;
    }
  });
}

// applyVendorFilter(): void {
//   if (!this.selectedVendorId) {
//     // show all vendors
//     this.filteredVendorComparisonList = this.vendorComparisonList;
//   } else {
//     // show only selected vendor’s bids
//     this.filteredVendorComparisonList = this.vendorComparisonList.map(item => ({
//       ...item,
//       vendorComparisonBid: item.vendorComparisonBid.filter(
//         (bid: any) => bid.vendorUserId === this.selectedVendorId
//       )
//     }));
//   }
// }

// applyVendorFilter() {
//   if (!this.selectedVendorId) {
//     // Show all vendors
//     this.filteredVendorComparisonList = this.vendorComparisonList;
//   } else {
//     // Only keep items where this vendor has at least 1 bid
//     this.filteredVendorComparisonList = this.vendorComparisonList
//       .map(item => ({
//         ...item,
//         vendorComparisonBid: item.vendorComparisonBid.filter(
//           (bid: any) => bid.vendorUserId === this.selectedVendorId
//         )
//       }))
//       .filter(item => item.vendorComparisonBid.length > 0); // remove items without bids
//   }
// }

// applyVendorItemFilter() {
//   this.filteredVendorComparisonList = this.vendorComparisonList
//     .map(item => {
//       // filter bids by vendor if vendor selected
//       let filteredBids = this.selectedVendorId
//         ? item.vendorComparisonBid.filter((bid: any) => bid.vendorUserId === this.selectedVendorId)
//         : item.vendorComparisonBid;

//       return {
//         ...item,
//         vendorComparisonBid: filteredBids
//       };
//     })
//     .filter(item => {
//       // remove items with no bids after vendor filter
//       if (item.vendorComparisonBid.length === 0) return false;

//       // if item filter selected, keep only matching item
//       if (this.selectedItemCode) {
//         return item.itemCode === this.selectedItemCode;
//       }

//       return true;
//     });
// }


applyVendorItemFilter() {
  this.filteredVendorComparisonList = this.vendorComparisonList
    .map(item => {
      // Vendor filter
      let bids = item.vendorComparisonBid;
      if (this.selectedVendorId) {
        bids = bids.filter((b: any) => b.vendorUserId == this.selectedVendorId);
      }

      // Return only item if it matches AND has bids
      if ((!this.selectedItemCode || item.itemCode === this.selectedItemCode) && bids.length > 0) {
        return { ...item, vendorComparisonBid: bids };
      }
      return null;
    })
    .filter(item => item !== null);
}


  // utility functions
  printVendor(vendor: any) {
    console.log('Printing Vendor:', vendor);
  }

  emailVendor(vendor: any) {
    console.log('Emailing Vendor:', vendor);
  }

  closeDialog() {
    this.activeModal.close(false);
  }

  toggleExpandRow(row: any) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  onActivate(event: any) {
    console.log('Event:', event);
  }
}
