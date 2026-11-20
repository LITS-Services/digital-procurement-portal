import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-po-remarks',
  templateUrl: './po-remarks.component.html',
  styleUrls: ['./po-remarks.component.scss'],
  standalone: false
})
export class PoRemarksComponent implements OnInit {

  @Input() action!: string;            // 'Approve' or 'Reject'
  @Input() purchaseOrderNo!: string;
  remarks: string = '';

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit(): void {
  }

  saveRemarks() {
    this.activeModal.close({
      action: this.action,
      remarks: this.remarks
    });
  }

  cancel() {
    this.activeModal.dismiss('cancel');
  }
}
