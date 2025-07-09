import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbAccordion, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { DatatableData } from 'app/data-tables/data/datatables.data';
import { PurchaseRequestAccountBudgetLookupModalComponent } from 'app/shared/modals/purchase-request-account-budget-lookup-modal/purchase-request-account-budget-lookup-modal.component';
import { PurchaseRequestAttachmentModalComponent } from 'app/shared/modals/purchase-request-attachment-modal/purchase-request-attachment-modal.component';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';

@Component({
  selector: 'app-new-purchase-request',
  templateUrl: './new-purchase-request.component.html',
  styleUrls: ['./new-purchase-request.component.scss']
})
export class NewPurchaseRequestComponent implements OnInit {
  numberOfAttachments = 0;
// newPurchaseRequestData = [];
newPurchaseRequestData = [
  {
    type: 'Inventory',
    itemCode: 'ITM001',
    description: 'Medical Expense',
    amount: '2024-10-01',
    vendorName: 'Vendor A',
    remarks: 'Urgent Order'
  },
  {
    type: 'Non-Inventory',
    itemCode: 'ITM002',
    description: 'Travel Expense',
    amount: '2024-10-02',
    vendorName: 'Vendor B',
    remarks: 'Routine Purchase'
  },
  {
    type: 'Inventory',
    itemCode: 'ITM003',
    description: 'Leave Enhancement',
    amount: '2024-10-03',
    vendorName: 'Vendor C',
    remarks: 'Leave Supplies'
  },
  {
    type: 'Non-Inventory',
    itemCode: 'ITM004',
    description: 'Medical Expense',
    amount: '2024-10-04',
    vendorName: 'Vendor D',
    remarks: 'Order for Clinic'
  },
  {
    type: 'Inventory',
    itemCode: 'ITM005',
    description: 'Others',
    amount: '2024-10-05',
    vendorName: 'Vendor E',
    remarks: 'Miscellaneous Items'
  }
];

public chkBoxSelected = [];
loading = false;
public rows = DatatableData;
columns = [
];
public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  newPurchaseRequestForm: FormGroup;
  @ViewChild('accordion') accordion: NgbAccordion;
  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('tableRowDetails') tableRowDetails: any;
  @ViewChild('tableResponsive') tableResponsive: any;
  constructor(
    private router: Router,
    private modalService: NgbModal,
    private attachmentService: PurchaseRequestService
  ) {
    this.attachmentService.currentFiles.subscribe(files => {
      this.numberOfAttachments = files.length; // Update the count based on the current files
    });
   }

  ngOnInit(): void {
    // this.attachmentService.currentFiles.subscribe(files => {
    //   this.numberOfAttachments = files.length;
    // });
   
  }
  homePage() {
    this.router.navigate(['/purchase-request']);
  }
  submitForm() {
  

  }
  deleteRow(rowIndex: number): void {
    this.newPurchaseRequestData.splice(rowIndex, 1);
  }
  openNewEntityModal() {
    const modalRef = this.modalService.open(PurchaseRequestAttachmentModalComponent, {
      backdrop: 'static',
      size: 'lg', // Adjust the size as needed
      centered: true,
    });
    modalRef.result.then((result) => {
      // Handle modal close results if necessary
    }, (reason) => {
      // Handle dismissal if needed
    });
   
  }

}
