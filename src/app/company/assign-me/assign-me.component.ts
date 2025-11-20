import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CompanyService } from 'app/shared/services/Company.services';

@Component({
  selector: 'app-assign-me',
  templateUrl: './assign-me.component.html',
  styleUrls: ['./assign-me.component.scss']
})
export class AssignMeComponent implements OnInit {
  @Input() ProcurementCompanyId!: number;
  @Input() entity!: string;
  @Input() vendorComapnyId!: number;
  @Input() vendorEntityAssociationId!: number;
  @Input() isAssigned!: boolean;
  @Input() assignedUserName!: string;

  assignMeForm: FormGroup;
  loading: boolean = false;
  errorMessage: string = '';

  showRemarks: boolean = false;   // <-- NEW

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private companyService: CompanyService
  ) {
    this.assignMeForm = this.fb.group({
      remarks: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Hide remarks initially when already assigned
    if (this.isAssigned) {
      this.assignMeForm.disable();
    } else {
      this.showRemarks = true;   // For fresh assignments
    }
  }

  closeDialog() {
    this.activeModal.close();
  }

  yesProceed() {
    this.showRemarks = true;     // Show remarks box
    this.assignMeForm.enable();  // Enable remarks form
  }

  submitForm() {
    if (!this.showRemarks) {
      this.errorMessage = "Please confirm to continue.";
      return;
    }

    if (this.assignMeForm.invalid) {
      this.assignMeForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.errorMessage = 'User ID not found!';
      this.loading = false;
      return;
    }

    const remarks = this.assignMeForm.value.remarks.trim();

    this.companyService.assignedMe(
      this.vendorEntityAssociationId,
      userId,
      remarks
    )
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.activeModal.close('success');
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Failed to assign. Try again.';
        }
      });
  }
}
