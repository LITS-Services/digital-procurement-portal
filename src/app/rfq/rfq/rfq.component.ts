import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { RfqQuotationboxComponent } from '../rfq-quotationbox/rfq-quotationbox.component';
import { RfqVendorModalComponent } from '../rfq-vendor-modal/rfq-vendor-modal.component';
import { VendorComparisionComponent } from '../vendor-comparision/vendor-comparision.component';

@Component({
  selector: 'app-rfq',
  templateUrl: './rfq.component.html',
  styleUrls: ['./rfq.component.scss']
})
export class RfqComponent implements OnInit {
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  rfqData = [
    {
      requisitionNo: 'REQ001', // Requisition No.
      status: 'Pending', // Status
      date: '2024-10-01', // Date (title column)
      owner: 'Mubashir', // Owner (announcementDate)
      department: 'IT', // Department (announcementEndDate)
      title: 'Cleaning Services Contract Renewal', // Title (fileName)
      vendors: "000035", // File path for download
      accounts: '03-63418', // Vendors, Accounts, Total Amount badges
      totalAmount: 2500000,
      notificationCount: 2
    },
    {
      requisitionNo: 'REQ001', // Requisition No.
      status: 'Pending', // Status
      date: '2024-10-01', // Date (title column)
      owner: 'Mubashir', // Owner (announcementDate)
      department: 'IT', // Department (announcementEndDate)
      title: 'Cleaning Services Contract Renewal', // Title (fileName)
      vendors: "000035", // File path for download
      accounts: '03-63418', // Vendors, Accounts, Total Amount badges
      totalAmount: 2500000,
      notificationCount: 3
    },
    {
      requisitionNo: 'REQ001', // Requisition No.
      status: 'Pending', // Status
      date: '2024-10-01', // Date (title column)
      owner: 'Mubashir', // Owner (announcementDate)
      department: 'IT', // Department (announcementEndDate)
      title: 'Cleaning Services Contract Renewal', // Title (fileName)
      vendors: "000035", // File path for download
      accounts: '03-63418', // Vendors, Accounts, Total Amount badges
      totalAmount: 2500000,
      notificationCount: 2
    },
    {
      requisitionNo: 'REQ001', // Requisition No.
      status: 'Pending', // Status
      date: '2024-10-01', // Date (title column)
      owner: 'Mubashir', // Owner (announcementDate)
      department: 'IT', // Department (announcementEndDate)
      title: 'Cleaning Services Contract Renewal', // Title (fileName)
      vendors: "000035", // File path for download
      accounts: '03-63418', // Vendors, Accounts, Total Amount badges
      totalAmount: 2500000,
      notificationCount: 6
    },
    {
      requisitionNo: 'REQ001', // Requisition No.
      status: 'Pending', // Status
      date: '2024-10-01', // Date (title column)
      owner: 'Mubashir', // Owner (announcementDate)
      department: 'IT', // Department (announcementEndDate)
      title: 'Cleaning Services Contract Renewal', // Title (fileName)
      vendors: "000035", // File path for download
      accounts: '03-63418', // Vendors, Accounts, Total Amount badges
      totalAmount: 2500000,
      notificationCount: 4
    },
    {
      requisitionNo: 'REQ001', // Requisition No.
      status: 'Pending', // Status
      date: '2024-10-01', // Date (title column)
      owner: 'Mubashir', // Owner (announcementDate)
      department: 'IT', // Department (announcementEndDate)
      title: 'Cleaning Services Contract Renewal', // Title (fileName)
      vendors: "000035", // File path for download
      accounts: '03-63418', // Vendors, Accounts, Total Amount badges
      totalAmount: 2500000,
      notificationCount: 5
    },
   
  ];

  
  public chkBoxSelected = [];
  loading = false;
  public rows = [];
  columns = [];
  announcementId: number;
  isEditButtonDisabled: boolean = true;
  isDeleteButtonDisabled: boolean = true;
  isOpenButtonDisabled: boolean = true;
  isAddNewDisable:boolean= true;
  isAllSelected: boolean = false;
  constructor( private router: Router,
    private modalService: NgbModal) { }

  ngOnInit(): void {
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
      const rows = [...this.rows];
      const sort = event.sorts[0];
      rows.sort((a, b) => {
        return a[sort.prop].localeCompare(b[sort.prop]) * (sort.dir === 'desc' ? -1 : 1);
      });
  
      this.rows = rows;
      this.loading = false;
    }, 1000);
  }
  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [];
    this.chkBoxSelected.splice(0, this.chkBoxSelected.length);
    this.chkBoxSelected.push(...selected);
    this.announcementId = selected[0]?.id;
    // Enable/disable edit and delete buttons based on the number of selected rows
    this.enableDisableButtons();

  }
  enableDisableButtons() {
    const selectedRowCount = this.chkBoxSelected.length;
    // Disable edit button by default
   // this.isEditButtonDisabled = true;
    // Enable delete button only if at least one row is selected
    this.isDeleteButtonDisabled = selectedRowCount === 0;
    // Enable edit button only if exactly one row is selected
    this.isEditButtonDisabled = selectedRowCount !== 1;
    this.isOpenButtonDisabled = selectedRowCount === 0;

      //this.isDeleteButtonDisabled =true;
if(this.rfqData.length!=this.chkBoxSelected.length){
  this.isAllSelected=false;
}
else{
  this.isAllSelected=true;
}
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
