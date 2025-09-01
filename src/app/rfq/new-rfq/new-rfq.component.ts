import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbAccordion, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { DatatableData } from 'app/data-tables/data/datatables.data';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { RfqAttachmentComponent } from '../rfq-attachment/rfq-attachment.component';

@Component({
  selector: 'app-new-rfq',
  templateUrl: './new-rfq.component.html',
  styleUrls: ['./new-rfq.component.scss']
})
export class NewRfqComponent implements OnInit {
  numberOfAttachments = 0;
newPurchaseRequestData = [
  {
    type: 'Inventory',
    itemCode: 'ITM001',
    description: 'Medical Expense',
    amount: '23000',
    vendorName: 'Vendor A',
    remarks: 'Urgent Order'
  },
  {
    type: 'Non-Inventory',
    itemCode: 'ITM002',
    description: 'Travel Expense',
    amount: '9000',
    vendorName: 'Vendor B',
    remarks: 'Routine Purchase'
  },
  {
    type: 'Inventory',
    itemCode: 'ITM003',
    description: 'Leave Enhancement',
    amount: '2000',
    vendorName: 'Vendor C',
    remarks: 'Leave Supplies'
  },
  {
    type: 'Non-Inventory',
    itemCode: 'ITM004',
    description: 'Medical Expense',
    amount: '4900',
    vendorName: 'Vendor D',
    remarks: 'Order for Clinic'
  },
  {
    type: 'Inventory',
    itemCode: 'ITM005',
    description: 'Others',
    amount: '8000',
    vendorName: 'Vendor E',
    remarks: 'Miscellaneous Items'
  }
];

public chkBoxSelected = [];
loading = false;
public rows = DatatableData;
columns = [
];
itemType: string = 'Inventory'; // Default selection

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
  ) { }

  ngOnInit(): void {
  }
  homePage() {
    this.router.navigate(['/rfq']);
  }
  submitForm() {
  

  }
  deleteRow(rowIndex: number): void {
    this.newPurchaseRequestData.splice(rowIndex, 1);
  }
  openNewEntityModal() {
    const modalRef = this.modalService.open(RfqAttachmentComponent, {
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
