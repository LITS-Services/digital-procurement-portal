import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { CompanyService } from 'app/shared/services/Company.services';

@Component({
  selector: 'app-procurment-companies-edit',
  templateUrl: './procurment-companies-edit.component.html',
  styleUrls: ['./procurment-companies-edit.component.scss']
})
export class ProcurmentCompaniesEditComponent implements OnInit {
  companyForm: UntypedFormGroup;
  previewUrl: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  companyId: number | null = null;
  isEditMode: boolean = false;
  existingLogo: string | null = null; // keep existing logo

  constructor(
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.queryParamMap.get('id');
    this.companyId = idParam ? +idParam : null;
    this.isEditMode = !!this.companyId;

    // Build form
    this.companyForm = this.fb.group({
      id: [{ value: '', disabled: true }],
      companyGUID: [this.isEditMode ? '' : this.generateGUID(), Validators.required],
      name: ['', Validators.required],
      logo: [null],
      isDeleted: [false] // default Active
    });

    if (this.isEditMode) {
      this.loadCompany();
    }
  }

  loadCompany() {
    this.companyService.getproByid(this.companyId).subscribe({
      next: (company: any) => {
        this.companyForm.patchValue({
          id: company.id,
          companyGUID: company.companyGUID,
          name: company.name,
          isDeleted: company.isDeleted
        });

        if (company.logo && company.logo !== 'string') {
          this.previewUrl = company.logo;
          this.existingLogo = company.logo;
        } else {
          this.previewUrl = null;
        }
      },
      error: (err) => console.error('Error loading company:', err)
    });
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = () => this.previewUrl = reader.result;
      reader.readAsDataURL(this.selectedFile);

      this.companyForm.patchValue({ logo: this.selectedFile });
    }
  }

  onSubmit() {
    if (this.companyForm.invalid) return;

    const userName = localStorage.getItem('userName') || 'Unknown';

    const payload: any = {
      id: this.isEditMode ? this.companyForm.getRawValue().id : 0,
      companyGUID: this.companyForm.value.companyGUID || this.generateGUID(),
      name: this.companyForm.value.name, 
      logo: this.existingLogo || 'string',
      isDeleted: !!this.companyForm.value.isDeleted
    };

    if (this.isEditMode) {
      payload.modifiedBy = userName;
      payload.modifiedDate = new Date().toISOString();
    } else {
      payload.createdBy = userName;
    }

    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        payload.logo = reader.result as string;
        this.sendPayload(payload);
      };
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.sendPayload(payload);
    }
  }

  private sendPayload(payload: any) {
    if (this.isEditMode) {
      this.companyService.updateProCompaniesById(this.companyId, payload).subscribe({
        next: (res) => {
          console.log('Company updated:', res);
          this.router.navigate(['/procurment-companies']);
        },
        error: (err) => console.error('Update failed:', err)
      });
    } else {
      this.companyService.createProCompany(payload).subscribe({
        next: (res) => {
          console.log('Company created:', res);
          this.router.navigate(['/procurment-companies']);
        },
        error: (err) => console.error('Creation failed:', err)
      });
    }
  }

  private generateGUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  onReset() {
    this.companyForm.reset();
    this.previewUrl = this.existingLogo || null;
    this.selectedFile = null;
    if (this.isEditMode) {
      this.loadCompany();
    } else {
      this.companyForm.patchValue({
        companyGUID: this.generateGUID(),
        isDeleted: false
      });
    }
  }

  goBack() {
    this.router.navigate(['/procurment-companies']);
  }
}
