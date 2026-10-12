import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
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
  @Input() data: any;
  @Input() viewMode: false;
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
      purchaseRequestId: [null],
      requisitionNo: [''],
      requesterName: [''],
      subject: [''],
      department: [''],
      description: [''],
      estimatedValue: [null],
      justification: [''],
      waiveApproval: [false],
      waiveAmount: [false],
    });
  }

  ngOnInit(): void {
    if (!this.data) return;
    if (this.viewMode) {
      this.exceptionPolicyForm.disable();
    }
    // Patch base fields
    this.exceptionPolicyForm.patchValue({
      purchaseRequestId: this.data.purchaseRequestId,
      requisitionNo: this.data.requisitionNo
    });

    // Patch existing exception policy if present
    const policy = this.data.existing || this.data.exceptionPolicy;
    if (policy) {
      this.exceptionPolicyForm.patchValue({
        requisitionNo: policy.requisitionNo,
        requesterName: policy.requesterName,
        subject: policy.subject,
        department: policy.department,
        description: policy.description,
        estimatedValue: policy.estimatedValue,
        justification: policy.justification,
        waiveApproval: !!policy.waiveApproval,
        waiveAmount: !!policy.waiveAmount
      });
    }
  }

  closeDialog() {
    this.activeModal.close(false);
  }
  submitForm() {
    this.activeModal.close(this.exceptionPolicyForm.value);
  }
}
