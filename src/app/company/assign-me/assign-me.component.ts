import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-assign-me',
  templateUrl: './assign-me.component.html',
  styleUrls: ['./assign-me.component.scss']
})
export class AssignMeComponent implements OnInit {
  @Input() ProcurementCompanyId!: number;
  @Input() entity!: string;
  @Input() vendorComapnyId!: number;
  assignMeForm: FormGroup;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,

  ) {
    this.assignMeForm = this.fb.group({
      remarks: ['', Validators.required],
    });
  }

  ngOnInit(): void {
  }

  closeDialog() {
    this.activeModal.close();
  }


  submitForm() {
    if (this.assignMeForm.invalid) {
      console.warn('Form is invalid');
      this.assignMeForm.markAllAsTouched();
      return;
    }

    console.log('Form Submitted Successfully');
    console.log('Form Values:', this.assignMeForm.value);
    this.activeModal.close();

  }

}
