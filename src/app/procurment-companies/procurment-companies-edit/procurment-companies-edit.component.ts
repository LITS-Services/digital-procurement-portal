import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { CompanyService } from 'app/shared/services/Company.services';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-procurment-companies-edit',
  templateUrl: './procurment-companies-edit.component.html',
  styleUrls: ['./procurment-companies-edit.component.scss']
})
export class ProcurmentCompaniesEditComponent implements OnInit {
  @ViewChild('addressModal') addressModalTemplate: any;

  companyForm: UntypedFormGroup;
  previewUrl: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  companyId: number | null = null;
  isEditMode: boolean = false;
  existingLogo: string | null = null; // keep existing logo

  addresses: any[] = [];
  selectedAddressIndex: number | null = null;
  addressForm: UntypedFormGroup;

  constructor(
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private companyService: CompanyService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef
  ) { }

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

    this.addressForm = this.fb.group({
      // id: [null],
      country: [''],
      city: [''],
      region: [''],
      address: [''],
      address2: [''],
      postCode: [null]
    });

    if (this.isEditMode) {
      this.loadCompany();
    }
  }

  loadCompany() {
    this.companyService.getProcurementCompanyById(this.companyId).subscribe({
      next: (res: any) => {
        const company = res; // <-- important
        if (!company) return;

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

        this.addresses = company.addressDetails || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading company:', err)
    });
  }

onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;

  if (input.files && input.files[0]) {
    this.selectedFile = input.files[0];

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
      this.existingLogo = null; 
      this.cdr.detectChanges();
    };

    reader.readAsDataURL(this.selectedFile);

    // if you still want to store File in the form:
    this.companyForm.patchValue({ logo: this.selectedFile });
  }
}

  //   onSubmit() {
  //     if (this.companyForm.invalid) return;

  //     //const userName = localStorage.getItem('userName') || 'Unknown';

  // const companyVM = {
  //   companyGUID: this.companyForm.value.companyGUID || this.generateGUID(),
  //   name: this.companyForm.value.name,
  //   logo: this.existingLogo || 'string',
  //   isDeleted: !!this.companyForm.value.isDeleted,
  //   addressDetails: this.addresses
  // };

  // const payload = {
  //   procurementCompanyVM: companyVM
  // };

  //     // if (this.isEditMode) {
  //     //   payload.modifiedBy = userName;
  //     //   payload.modifiedDate = new Date().toISOString();
  //     // } else {
  //     //   payload.createdBy = userName;
  //     // }

  //     if (this.selectedFile) {
  //       const reader = new FileReader();
  //       reader.onload = () => {
  //         payload.procurementCompanyVM['logo'] = reader.result as string;
  //         this.sendPayload(payload);
  //       };
  //       reader.readAsDataURL(this.selectedFile);
  //     } else {
  //       this.sendPayload(payload);
  //     }
  //   }

  onSubmit() {
    if (this.companyForm.invalid) return;

    const companyData: any = {
      companyGUID: this.companyForm.value.companyGUID || this.generateGUID(),
      name: this.companyForm.value.name,
      logo: this.existingLogo || 'string',
      isDeleted: !!this.companyForm.value.isDeleted,
      addressDetails: this.addresses
    };

    const sendRequest = () => {
      if (this.isEditMode) {
        // Update
        const payload = {
          id: this.companyId,
          procurementCompany: companyData
        };
        this.companyService.updateProCompaniesById(this.companyId, payload).subscribe({
          next: (res) => this.router.navigate(['/procurment-companies']),
          error: (err) => console.error('Update failed:', err)
        });
      } else {
        // Create
        const payload = {
          procurementCompanyVM: companyData
        };
        this.companyService.createProCompany(payload).subscribe({
          next: (res) => this.router.navigate(['/procurment-companies']),
          error: (err) => console.error('Creation failed:', err)
        });
      }
    };

    // Handle file upload if present
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        companyData.logo = reader.result as string;
        sendRequest();
      };
      reader.readAsDataURL(this.selectedFile);
    } else {
      sendRequest();
    }
  }

  private sendPayload(payload: any) {
    if (this.isEditMode) {
      this.companyService.updateProCompaniesById(this.companyId, payload).subscribe({
        next: (res) => {
          this.router.navigate(['/procurment-companies']);
        },
        error: (err) => console.error('Update failed:', err)
      });
    } else {
      this.companyService.createProCompany(payload).subscribe({
        next: (res) => {
          this.router.navigate(['/procurment-companies']);
        },
        error: (err) => console.error('Creation failed:', err)
      });
    }
  }

  private generateGUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
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

  openAddAddressModal() {
    this.selectedAddressIndex = null;
    this.addressForm.reset();
    this.modalService.open(this.addressModalTemplate, {
      backdrop: 'static',
      size: 'lg',
      centered: true,         // Centers the modal vertically
      windowClass: 'compact-modal' // Custom class
    });
  }

  editAddress(index: number) {
    this.selectedAddressIndex = index;

    this.addressForm.patchValue({
      //id: this.addresses[index].id,
      country: this.addresses[index].country,
      city: this.addresses[index].city,
      region: this.addresses[index].region,
      address: this.addresses[index].address,
      address2: this.addresses[index].address2,
      postCode: this.addresses[index].postCode
    });

    this.modalService.open(this.addressModalTemplate, {
      backdrop: 'static',
      size: 'lg',
      centered: true,         // Centers the modal vertically
      windowClass: 'compact-modal' // Custom class
    });
  }

  saveAddress(modal: any) {
    if (this.addressForm.invalid) return;

    const address = this.addressForm.value;

    if (this.selectedAddressIndex !== null) {
      this.addresses[this.selectedAddressIndex] = address;
    } else {
      this.addresses.push(address);
    }
    modal.close();
  }

  deleteAddress(index: number) {
    this.addresses.splice(index, 1);
  }

}