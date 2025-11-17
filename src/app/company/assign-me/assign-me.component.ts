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
  @Input() vendorEntityAssociationId!: number; // Added this input
  
  assignMeForm: FormGroup;
  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private companyService: CompanyService // Added CompanyService
  ) {
    this.assignMeForm = this.fb.group({
      remarks: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    console.log('AssignMe Modal initialized with:', {
      ProcurementCompanyId: this.ProcurementCompanyId,
      entity: this.entity,
      vendorComapnyId: this.vendorComapnyId,
      vendorEntityAssociationId: this.vendorEntityAssociationId
    });
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

  this.loading = true;
  this.errorMessage = '';

  const userId = localStorage.getItem('userId');
  if (!userId) {
    this.errorMessage = 'User ID not found. Please log in again.';
    this.loading = false;
    return;
  }

  const remarks = this.assignMeForm.value.remarks.trim();

  console.log('Sending assign to me request:', {
    vendorEntityAssociationId: this.vendorEntityAssociationId,
    approverId: userId,
    remarks
  });

  this.companyService.assignedMe(this.vendorEntityAssociationId, userId, remarks)
    .subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Assign to me successful:', response);
        this.activeModal.close('success');
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Failed to assign company. Please try again.';
        console.error('Assign to me error:', error);
      }
    });
}

}