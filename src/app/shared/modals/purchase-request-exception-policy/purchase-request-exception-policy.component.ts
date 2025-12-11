import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-purchase-request-exception-policy',
  templateUrl: './purchase-request-exception-policy.component.html',
  styleUrls: ['./purchase-request-exception-policy.component.scss'],
  standalone: false
})
export class PurchaseRequestExceptionPolicyComponent implements OnInit {

  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('tableRowDetails') tableRowDetails: any;
  @ViewChild('tableResponsive') tableResponsive: any;
  // accountBudgetLookup = [];
  exceptionPolicyForm: FormGroup;
  public ColumnMode = ColumnMode;
  selectedOption: string = '';
  constructor(public activeModal: NgbActiveModal,
    private http: HttpClient,
    private formBuilder: FormBuilder,
  ) {
    this.exceptionPolicyForm = this.formBuilder.group({
      supplierOption: [''], // Radio buttons for supplier option
      supplierName: ['']    // Supplier name dropdown (conditionally displayed)
    });
   }

  ngOnInit(): void {
  }
  closeDialog() {
    this.activeModal.close(false);
  }
  submitForm() {
  

  }
}
