import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { RfqQuotationboxComponent } from '../rfq-quotationbox/rfq-quotationbox.component';
import { RfqVendorModalComponent } from '../rfq-vendor-modal/rfq-vendor-modal.component';
import { VendorComparisionComponent } from '../vendor-comparision/vendor-comparision.component';
import { RfqService } from '../rfq.service';

@Component({
  selector: 'app-rfq',
  templateUrl: './rfq.component.html',
  styleUrls: ['./rfq.component.scss']
})
export class RfqComponent implements OnInit {
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  rfqData: any[] = [];
  chkBoxSelected: any[] = [];
  idsToDelete: number[] = [];
  loading = false;
  announcementId: number;
  isEditButtonDisabled = true;
  isDeleteButtonDisabled = true;
  isOpenButtonDisabled = true;
  isAllSelected = false;
  columns = [];

  // public chkBoxSelected = [];
  // loading = false;
  // public rows = [];
  // columns = [];
  // announcementId: number;
  // isEditButtonDisabled: boolean = true;
  // isDeleteButtonDisabled: boolean = true;
  // isOpenButtonDisabled: boolean = true;
  // isAddNewDisable:boolean= true;
  // isAllSelected: boolean = false;

  constructor(private router: Router, private modalService: NgbModal,
    private route: ActivatedRoute, private rfqService: RfqService
  ) { }

  ngOnInit(): void {
    this.loadRfqs();
  }

  loadRfqs() {
    this.loading = true;
    this.rfqService.getAllQuotations().subscribe({
      next: (data: any) => {
        this.rfqData = data?.$values || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching RFQs:', err);
        this.loading = false;
      }
    });
  }

  onView() {
    if (this.chkBoxSelected.length !== 1) {
      alert('Please select exactly one record to view.');
      return;
    }

    const selectedId = this.chkBoxSelected[0].requestId;

    this.router.navigate(['/purchase-request/new-purchase-request'], {
      queryParams: { id: selectedId, mode: 'view' }
    });
  }

  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  openEmpDetails() {
    this.router.navigate(['/rfq/new-rfq']);
  }

  onSort(event) {
    this.loading = true;
    setTimeout(() => {
      const sort = event.sorts[0];
      this.rfqData.sort((a, b) => {
        const aValue = (a[sort.prop] ?? '').toString();
        const bValue = (b[sort.prop] ?? '').toString();
        return aValue.localeCompare(bValue) * (sort.dir === 'desc' ? -1 : 1);
      });
      this.loading = false;
    }, 200);
  }

  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [...selected];
    this.idsToDelete = this.chkBoxSelected.map(item => item.quotationId);
    this.enableDisableButtons();
  }


  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.chkBoxSelected = [...this.rfqData];
    } else {
      this.chkBoxSelected = [];
    }
    this.idsToDelete = this.chkBoxSelected.map(item => item.quotationId);
    this.isAllSelected = event.target.checked;
    this.enableDisableButtons();
  }

  enableDisableButtons() {
    const selectedCount = this.chkBoxSelected.length;
    this.isDeleteButtonDisabled = selectedCount === 0;
    this.isEditButtonDisabled = selectedCount !== 1;
    this.isOpenButtonDisabled = selectedCount === 0;
    this.isAllSelected = this.rfqData.length === this.chkBoxSelected.length;
  }

  openDeleteModal(deleteModal) {
    if (this.idsToDelete.length > 0) {
      this.modalService.open(deleteModal, { backdrop: 'static', centered: true });
    } else {
      alert('Please select at least one record to delete.');
    }
  }

  confirmDelete() {
    if (this.idsToDelete.length === 0) return;

    console.log('Deleting IDs:', this.idsToDelete);

    this.rfqService.deleteQuotation(this.idsToDelete).subscribe({
      next: () => {
        this.modalService.dismissAll();
        this.loadRfqs();
        this.chkBoxSelected = [];
        this.idsToDelete = [];
      },
      error: (err) => {
        console.error('Delete failed:', err);
      }
    });
  }

  onUpdate() {
    if (this.chkBoxSelected.length === 0) {
      alert('Please select a record to update.');
      return;
    }

    if (this.chkBoxSelected.length > 1) {
      alert('Please select only one record to update.');
      return;
    }

    const selectedId = this.chkBoxSelected[0].quotationId;
    console.log('Navigating to update ID:', selectedId);

    this.router.navigate(['/rfq/new-rfq'], {
      queryParams: { id: selectedId }
    });
  }

  openQuotationBoxModal(row: any): void {
    const modalRef = this.modalService.open(RfqQuotationboxComponent, { size: 'lg', backdrop: 'static', centered: true });
    modalRef.componentInstance.data = row;  // Pass selected row data if needed
  }

  openVendorsModal(row: any): void {
    const modalRef = this.modalService.open(RfqVendorModalComponent, { size: 'lg', backdrop: 'static', centered: true });
    modalRef.componentInstance.data = row;  // Pass selected row data if needed
  }

  openVendorComparisonModal(row: any): void {
    const modalRef = this.modalService.open(VendorComparisionComponent, { size: 'lg', backdrop: 'static', centered: true });
    modalRef.componentInstance.data = row;  // Pass selected row data if needed
  }

}

// import { Component, OnInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
// import { RfqQuotationboxComponent } from '../rfq-quotationbox/rfq-quotationbox.component';
// import { RfqVendorModalComponent } from '../rfq-vendor-modal/rfq-vendor-modal.component';
// import { VendorComparisionComponent } from '../vendor-comparision/vendor-comparision.component';
// import { RfqService } from '../rfq.service';
// @Component({
//   selector: 'app-rfq',
//   templateUrl: './rfq.component.html',
//   styleUrls: ['./rfq.component.scss']
// })
// export class RfqComponent implements OnInit {
//   public SelectionType = SelectionType;
//   public ColumnMode = ColumnMode;
//   rfqData = [];

//   public chkBoxSelected = [];
//   loading = false;
//   public rows = [];
//   columns = [];
//   announcementId: number;
//   isEditButtonDisabled: boolean = true;
//   isDeleteButtonDisabled: boolean = true;
//   isOpenButtonDisabled: boolean = true;
//   isAddNewDisable:boolean = true;
//   isAllSelected: boolean = false;

//   constructor(
//     private router: Router,
//     private modalService: NgbModal,
//     private rfqService: RfqService
//   ) { }

//   ngOnInit(): void {
//     this.getAllRfq();
//   }

//   getAllRfq(): void {
//     this.loading = true;
//     this.rfqService.getAllQuotations().subscribe({
//       next: (res) => {
//         this.rfqData = res;
//         this.loading = false;
//       },
//       error: (err) => {
//         console.error('Error loading RFQs', err);
//         this.loading = false;
//       }
//     });
//   }

//   homePage() {
//     this.router.navigate(['/dashboard/dashboard1']);
//   }

//   openEmpDetails() {
//     this.router.navigate(['/rfq/new-rfq']);
//   }

//   onSort(event) {
//     this.loading = true;
//     setTimeout(() => {
//       const rows = [...this.rfqData];
//       const sort = event.sorts[0];
//       rows.sort((a, b) => {
//         return a[sort.prop]?.toString().localeCompare(b[sort.prop]?.toString()) * (sort.dir === 'desc' ? -1 : 1);
//       });

//       this.rfqData = rows;
//       this.loading = false;
//     }, 1000);
//   }

//   customChkboxOnSelect({ selected }) {
//     this.chkBoxSelected = [];
//     this.chkBoxSelected.splice(0, this.chkBoxSelected.length);
//     this.chkBoxSelected.push(...selected);
//     this.announcementId = selected[0]?.id;
//     this.enableDisableButtons();
//   }

//   enableDisableButtons() {
//     const selectedRowCount = this.chkBoxSelected.length;
//     this.isDeleteButtonDisabled = selectedRowCount === 0;
//     this.isEditButtonDisabled = selectedRowCount !== 1;
//     this.isOpenButtonDisabled = selectedRowCount === 0;

//     if (this.rfqData.length !== this.chkBoxSelected.length) {
//       this.isAllSelected = false;
//     } else {
//       this.isAllSelected = true;
//     }
//   }

//   openQuotationBoxModal(row: any): void {
//     const modalRef = this.modalService.open(RfqQuotationboxComponent, { size: 'lg', backdrop: 'static', centered: true });
//     modalRef.componentInstance.data = row;
//   }

//   openVendorsModal(row: any): void {
//     const modalRef = this.modalService.open(RfqVendorModalComponent, { size: 'lg', backdrop: 'static', centered: true });
//     modalRef.componentInstance.data = row;
//   }

//   openVendorComparisonModal(row: any): void {
//     const modalRef = this.modalService.open(VendorComparisionComponent, { size: 'lg', backdrop: 'static', centered: true });
//     modalRef.componentInstance.data = row;
//   }
// }

// import { Component, OnInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
// import { RfqQuotationboxComponent } from '../rfq-quotationbox/rfq-quotationbox.component';
// import { RfqVendorModalComponent } from '../rfq-vendor-modal/rfq-vendor-modal.component';
// import { VendorComparisionComponent } from '../vendor-comparision/vendor-comparision.component';
// import { RfqService } from '../rfq.service';

// @Component({
//   selector: 'app-rfq',
//   templateUrl: './rfq.component.html',
//   styleUrls: ['./rfq.component.scss']
// })
// export class RfqComponent implements OnInit {
//   public SelectionType = SelectionType;
//   public ColumnMode = ColumnMode;

//   rfqData: any[] = [];
//   chkBoxSelected: any[] = [];
//   loading = false;
//   isEditButtonDisabled = true;
//   isDeleteButtonDisabled = true; 
//   isOpenButtonDisabled = true;
//   isAddNewDisable = false; // Typically should be enabled
//   isAllSelected = false;

//   columns = [
//     { name: 'Sr. No.', prop: 'srNo', width: 50, sortable: false },
//     { name: 'RFQ No.', prop: 'rfqNo', width: 100 },
//     { name: 'Status', prop: 'status', width: 100 },
//     { name: 'Date', prop: 'date', width: 120 },
//     { name: 'Owner', prop: 'createdBy', width: 120 },
//     { name: 'Comments', prop: 'comment', width: 180 },
//     { name: 'Total Amount', prop: 'amount', width: 120, sortable: false },
//     { name: 'Quotation Box', width: 120, sortable: false },
//     { name: 'Vendor Comparison', width: 120, sortable: false },
//     { name: 'Vendors', width: 100, sortable: false }
//   ];

//   constructor(
//     private router: Router,
//     private modalService: NgbModal,
//     private rfqService: RfqService
//   ) { }

//   ngOnInit(): void {
//     this.getAllRfq();
//   }

//   getAllRfq(): void {
//     this.loading = true;
//     this.rfqService.getAllQuotations().subscribe({
//       next: (res) => {
//         this.rfqData = res.map((item, index) => ({
//           ...item,
//           srNo: index + 1, // add serial number
//           amount: item.amount ?? 0,
//           comment: item.comment ?? '' // make sure property exists
//         }));
//         this.loading = false;
//       },
//       error: (err) => {
//         console.error('Error loading RFQs', err);
//         this.loading = false;
//       }
//     });
//   }

//   homePage() {
//     this.router.navigate(['/dashboard/dashboard1']);
//   }

//   openEmpDetails() {
//     this.router.navigate(['/rfq/new-rfq']);
//   }

//   onSort(event) {
//     this.loading = true;
//     setTimeout(() => {
//       const sort = event.sorts[0];
//       const sorted = [...this.rfqData].sort((a, b) => {
//         const aVal = a[sort.prop] ?? '';
//         const bVal = b[sort.prop] ?? '';
//         return (aVal.toString().localeCompare(bVal.toString())) * (sort.dir === 'desc' ? -1 : 1);
//       });
//       this.rfqData = sorted;
//       this.loading = false;
//     }, 300); // faster sorting
//   }

//   customChkboxOnSelect({ selected }) {
//     this.chkBoxSelected = [...selected];
//     this.enableDisableButtons();
//   }

//   enableDisableButtons() {
//     const selectedRowCount = this.chkBoxSelected.length;
//     this.isDeleteButtonDisabled = selectedRowCount === 0;
//     this.isEditButtonDisabled = selectedRowCount !== 1;
//     this.isOpenButtonDisabled = selectedRowCount === 0;
//     this.isAllSelected = this.rfqData.length > 0 && selectedRowCount === this.rfqData.length;
//   }

//   toggleSelectAll(event) {
//     if (event.target.checked) {
//       this.chkBoxSelected = [...this.rfqData];
//     } else {
//       this.chkBoxSelected = [];
//     }
//     this.enableDisableButtons();
//   }

//   openQuotationBoxModal(row: any): void {
//     const modalRef = this.modalService.open(RfqQuotationboxComponent, { size: 'lg', backdrop: 'static', centered: true });
//     modalRef.componentInstance.data = row;
//   }

//   openVendorsModal(row: any): void {
//     const modalRef = this.modalService.open(RfqVendorModalComponent, { size: 'lg', backdrop: 'static', centered: true });
//     modalRef.componentInstance.data = row;
//   }

//   openVendorComparisonModal(row: any): void {
//     const modalRef = this.modalService.open(VendorComparisionComponent, { size: 'lg', backdrop: 'static', centered: true });
//     modalRef.componentInstance.data = row;
//   }

//   // Example Edit Button Click
//   onEdit() {
//     if (this.chkBoxSelected.length === 1) {
//       const id = this.chkBoxSelected[0].quotationId || this.chkBoxSelected[0].id;
//       this.router.navigate(['/rfq/edit-rfq', id]);
//     }
//   }

//   // Example Delete Button Click
//   onDelete() {
//     if (this.chkBoxSelected.length === 0) return;
//     // Add confirmation and then call service to delete
//     if(confirm(`Are you sure you want to delete selected RFQ(s)?`)) {
//       const deleteObservables = this.chkBoxSelected.map(item => this.rfqService.deleteQuotation(item.quotationId || item.id));
//       Promise.all(deleteObservables.map(obs => obs.toPromise()))
//         .then(() => this.getAllRfq())
//         .catch(err => console.error(err));
//     }
//   }
// }
