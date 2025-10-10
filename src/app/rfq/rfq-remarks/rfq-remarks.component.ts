import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-rfq-remarks',
  templateUrl: './rfq-remarks.component.html',
  styleUrls: ['./rfq-remarks.component.scss']
})
export class RfqRemarksComponent implements OnInit {

  @Input() action!: string;  // e.g. Approve, Reject, etc.
  remarks: string = '';

  constructor(public activeModal: NgbActiveModal, private router: Router, public cdr: ChangeDetectorRef) { }
  ngOnInit(): void {
  }

  saveRemarks() {
    // send data back to parent
    this.activeModal.close({
      action: this.action,
      remarks: this.remarks
    });
    this.router.navigate(['/rfq']);
    this.cdr.detectChanges();
  }

  cancel() {
    this.activeModal.dismiss('cancel');
  }
}
