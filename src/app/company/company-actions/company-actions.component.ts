import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-company-actions',
  templateUrl: './company-actions.component.html',
  styleUrls: ['./company-actions.component.scss'],
  standalone: false
})
export class CompanyActionsComponent implements OnInit {
  @Input() action!: string;  // e.g. Approve, Reject, etc.
  remarks: string = '';
  constructor(
    public activeModal: NgbActiveModal, 
    private router: Router, 
    public cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
  }

    saveActions() {
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
