import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyService } from 'app/shared/services/Company.services';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CompanyActionsComponent } from '../company-actions/company-actions.component';

@Component({
  selector: 'app-company-edit',
  templateUrl: './company-edit.component.html',
  styleUrls: ['./company-edit.component.scss']
})
export class CompanyEditComponent implements OnInit {

  companyId: number | null = null;
  procurementCompanyId: number | null = null; // ✅ Added this
  companyGUID: string | null = null;
  vendorId: string = '';
  companyName: string = '';
  aboutCompany: string = '';
  vendorCategory: string = '';
  primaryCurrency: string = '';
  lineOfBusiness: string = '';
  employeeResponsible: string = '';
  note: string = '';
  attachedFiles: any[] = [];
  addressList: any[] = [];
  contactList: any[] = [];
  isEditMode: boolean = false;
  isLoading: boolean = false;
  error: string = '';
  remark: string = '';
  message: string = '';
  actionType!: string;
  private modalRef!: NgbModalRef;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.companyId = +params['id'];
        this.procurementCompanyId = params['procurementCompanyId'] ? +params['procurementCompanyId'] : null; // ✅ Capture ID
        this.loadCompanyById(this.companyId);
      }
    });
  }

  loadCompanyById(id: number) {
    this.isLoading = true;
    this.error = '';
    this.message = '';

    this.companyService.getCompanyById(id).subscribe({
      next: (res: any) => {
        const company = res?.vendorCompany || res;
        if (company) {
          this.companyId = company.id || 0;
          this.companyGUID = company.companyGUID || null;
          this.vendorId = company.vendorId || '';
          this.companyName = company.name || '';
          this.aboutCompany = company.aboutCompany || '';
          this.vendorCategory = company.purchasingDemographics?.vendorType || '';
          this.primaryCurrency = company.purchasingDemographics?.primaryCurrency || '';
          this.lineOfBusiness = company.purchasingDemographics?.lineOfBusiness || '';
          this.employeeResponsible = company.purchasingDemographics?.employeeResponsible || '';
          this.note = company.purchasingDemographics?.note || '';

          this.addressList = (company.addresses?.$values || []).map((a: any) => ({
            id: a.id,
            street: a.street,
            city: a.city,
            state: a.state,
            zip: a.zip,
            country: a.country,
            isPrimary: a.isPrimary
          }));

          this.contactList = (company.contacts?.$values || []).map((c: any) => ({
            id: c.id,
            description: c.description,
            type: c.type,
            contactNumber: c.contactNumber,
            extension: c.extension,
            isPrimary: c.isPrimary
          }));

          this.attachedFiles = (company.attachments?.$values || []).map((f: any) => ({
            id: f.id,
            fileName: f.fileName,
            format: f.fileFormat,
            fileContent: f.fileContent,
            attachedBy: f.attachedBy,
            remarks: f.remarks,
            attachedAt: f.attachedAt
          }));

          this.isEditMode = true;
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading company:', err);
        this.error = 'Failed to load company.';
        this.isLoading = false;
      }
    });
  }

 onActions(action: string): void {
  const modalRef = this.modalService.open(CompanyActionsComponent, {
    size: 'lg',
    backdrop: 'static',
    centered: true
  });

  modalRef.componentInstance.action = action;

  modalRef.result.then(
    (result) => {
      if (result) {
        this.isLoading = true;

        const payload = {
          vendorCompanyId: this.companyId,
          procurementCompanyId: this.procurementCompanyId || 0,
          actionTaken: action,       // separate action
          remarks: result.remarks,   // plain string from modal
          approverId: localStorage.getItem('userId') || ''
        };

        this.companyService.VendorCompanyAction(payload).subscribe({
          next: (res) => {
            this.isLoading = false;
            this.message =
              action === 'Approve'
                ? 'Company Approved Successfully!'
                : action === 'Reject'
                ? 'Company Rejected Successfully!'
                : 'Company Sent Back Successfully!';
            this.cdr.detectChanges();
            this.router.navigate(['/company']);
          },
          error: (err) => {
            this.isLoading = false;
            this.error = 'Failed to perform action!';
            console.error(err);
          }
        });
      }
    },
    (reason) => {
      console.log(`Modal dismissed: ${reason}`);
    }
  );
}



  downloadAttachment(file: any) {
    if (!file?.fileContent) {
      this.message = 'File content not available for download.';
      return;
    }
    const byteCharacters = atob(file.fileContent);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: file.format || 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName || 'attachment';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  goBack() {
    this.router.navigate(['/company']);
  }
}
