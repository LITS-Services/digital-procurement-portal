import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-purchase-request-account-budget-lookup-modal',
  templateUrl: './purchase-request-account-budget-lookup-modal.component.html',
  styleUrls: ['./purchase-request-account-budget-lookup-modal.component.scss']
})
export class PurchaseRequestAccountBudgetLookupModalComponent implements OnInit {
  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('tableRowDetails') tableRowDetails: any;
  @ViewChild('tableResponsive') tableResponsive: any;
  accountBudgetLookup = [];
  public ColumnMode = ColumnMode;
  constructor(public activeModal: NgbActiveModal,
    private http: HttpClient,
  ) { }

  ngOnInit(): void {
  }
  closeDialog() {
    this.activeModal.close(false);
  }
}
