import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-purchase-request-remarks',
  templateUrl: './purchase-request-remarks.component.html',
  styleUrls: ['./purchase-request-remarks.component.scss']
})
export class PurchaseRequestRemarksComponent implements OnInit {

 @Input() action!: string;  // e.g. Approve, Reject, etc.
   remarks: string = '';
 
   constructor(public activeModal: NgbActiveModal) { }
   ngOnInit(): void {
   }
 
   saveRemarks() {
     // send data back to parent
     this.activeModal.close({
       action: this.action,
       remarks: this.remarks
     });
   }
 
   cancel() {
     this.activeModal.dismiss('cancel');
   }
}
