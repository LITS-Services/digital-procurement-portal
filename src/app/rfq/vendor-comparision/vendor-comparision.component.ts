import { ChangeDetectorRef, Component, Input, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
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

  filteredVendorComparisonList: any[] = [];

  items: string[] = [];
flatRows: any[] = [];        // filtered + sorted rows shown in table
allRows: any[] = [];         // master flat dataset

// filters
selectedItem: string = '';
selectedVendorId: string = '';

amountSort: 'none' | 'asc' | 'desc' = 'none';
@ViewChild('attachmentsModal') attachmentsModal: any;
  selectedBid: any = null;

  constructor(
    private rfqService: RfqService,
    private modalService: NgbModal,
    public cdr: ChangeDetectorRef

  ) { }

  ngOnInit(): void {
    if (this.data && this.data.quotationId) {
      this.loadVendorComparison(this.data.quotationId); // load bids for given quotationRequestId
      //  this.filteredVendorComparisonList = this.vendorComparisonList;
    }
  }


 loadVendorComparison(quotationRequestId: number): void {
  this.rfqService.getVendorComparison(quotationRequestId).subscribe({
    next: (res) => {
      const items = res?.items || [];

      this.vendorComparisonList = items.map((item: any) => ({
        itemName: item.itemName,
        itemDescription: item.itemDescription,
        vendorComparisonBid: (item.vendorComparisonBid || []).map((bid: any) => ({
          vendorUserId: bid.vendorUserId,
          vendorName: bid.vendorName,
          comment: bid.comment,
          biddingAmount: bid.biddingAmount,
          vendorAttachments: bid.vendorAttachments || []
        }))
      }));

      // unique vendors (unchanged from your version)
      const vendorMap = new Map<string, string>();
      this.vendorComparisonList.forEach(item => {
        item.vendorComparisonBid.forEach((bid: any) => {
          if (bid.vendorUserId && !vendorMap.has(bid.vendorUserId)) {
            vendorMap.set(bid.vendorUserId, bid.vendorName);
          }
        });
      });
      this.vendors = Array.from(vendorMap, ([vendorUserId, vendorName]) => ({ vendorUserId, vendorName }));

      // unique items for filter
      const itemSet = new Set<string>();
      this.vendorComparisonList.forEach(it => itemSet.add(it.itemName));
      this.items = Array.from(itemSet);

      // build master flat list once
      const rows: any[] = [];
      this.vendorComparisonList.forEach(item => {
        item.vendorComparisonBid.forEach((b: any) => {
          rows.push({
            itemName: item.itemName,
            itemDescription: item.itemDescription,
            vendorUserId: b.vendorUserId,
            vendorName: b.vendorName,
            comment: b.comment,
            biddingAmount: b.biddingAmount,
            vendorAttachments: b.vendorAttachments || []
          });
        });
      });
      this.allRows = rows;

      // initial paint
      this.applyFiltersSort();

      this.cdr.detectChanges();
      this.loading = false;
    },
    error: (err) => {
      console.error('Error loading vendor comparison', err);
      this.loading = false;
    }
  });
}

applyFiltersSort(): void {
  let rows = this.allRows;

  if (this.selectedItem) {
    rows = rows.filter(r => r.itemName === this.selectedItem);
  }
  if (this.selectedVendorId) {
    rows = rows.filter(r => String(r.vendorUserId) === String(this.selectedVendorId));
  }

  // sort by amount
  if (this.amountSort !== 'none') {
    const dir = this.amountSort === 'asc' ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      const A = Number(a.biddingAmount) || 0;
      const B = Number(b.biddingAmount) || 0;
      return (A - B) * dir;
    });
  }

  this.flatRows = rows;

  // optional: if table ref exists and you want recalculation
  // this.table?.recalculate();
}

getVendorNameById(vendorId: string): string {
  const vendor = this.vendors.find(v => String(v.vendorUserId) === String(vendorId));
  return vendor ? vendor.vendorName : vendorId;
}

clearFilters(): void {
  this.selectedItem = '';
  this.selectedVendorId = '';
  this.amountSort = 'none';
  this.applyFiltersSort();
}

  applyVendorItemFilter() {
    this.filteredVendorComparisonList = this.vendorComparisonList
      .filter(item =>
        (!this.selectedItem || item.itemName === this.selectedItem)
      )
      .map(item => {
        let bids = this.selectedVendorId
          ? item.vendorComparisonBid.filter((b: any) => b.vendorUserId == this.selectedVendorId)
          : item.vendorComparisonBid;

        return { ...item, vendorComparisonBid: bids };
      })
      .filter(item => item.vendorComparisonBid.length > 0);
  }

  // utility functions
  printVendor(vendor: any) {
    console.log('Printing Vendor:', vendor);
  }

  emailVendor(vendor: any) {
    console.log('Emailing Vendor:', vendor);
  }

  // closeDialog() {
  //   this.activeModal.close(false);
  // }

  toggleExpandRow(row: any) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  onActivate(event: any) {
    console.log('Event:', event);
  }

  openAttachmentsModal(row: any) {
    this.selectedBid = row;
    this.modalService.open(this.attachmentsModal, { size: 'lg', backdrop: 'static', centered: true });
  }

  downloadAttachment(att: any): void {
    if (!att?.content || !att?.fileName) return;

    const byteCharacters = atob(att.content);
    const byteNumbers = new Array(byteCharacters.length)
      .fill(0)
      .map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: att.contentType || 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = att.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

}
