import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyService } from 'app/shared/services/Company.services';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-company-edit',
  templateUrl: './company-edit.component.html',
  styleUrls: ['./company-edit.component.scss']
})
export class CompanyEditComponent implements OnInit {

  companyId: number | null = null;
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
  actionType!: number; // 2 = Approve, 4 = Recall
  private modalRef!: NgbModalRef;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.companyId = +params['id'];
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

  openRemarkModal(action: number, content: any) {
    this.actionType = action;
    this.remark = '';
    this.modalRef = this.modalService.open(content, { backdrop: 'static', size: 'md' });
  }

  submitRemark() {
    if (!this.remark.trim()) {
      alert('Please enter a remark');
      return;
    }

    this.reviewCompany(this.actionType, this.remark);
    this.modalRef.close();
  }

  async reviewCompany(requestStatusId: number, remark?: string) {
    if (!this.companyId) {
      this.error = 'Company ID missing! Cannot proceed.';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.message = '';
    this.remark = remark || this.remark;

    this.attachedFiles = await Promise.all(this.attachedFiles.map(async f => {
      if (f.file && !f.fileContent) {
        f.fileContent = await this.convertFileToBase64(f.file);
      }
      return f;
    }));

    const approverId = localStorage.getItem('userId') || '';

    const payload = {
      Id: this.companyId || 0,
      VendorCompany: {
        Id: this.companyId || 0,
        CompanyGUID: this.companyGUID || null,
        Name: this.companyName,
        Logo: '',
        approverId: approverId,
        Remarks: this.remark || '',
        RequestStatusId: requestStatusId,
        VendorId: this.vendorId || '',
        Attachments: this.attachedFiles.map((f: any) => ({
          Id: f.id || 0,
          VendorCompanyId: this.companyId || 0,
          FileName: f.fileName,
          FileFormat: f.format,
          FileContent: f.fileContent,
          AttachedBy: f.attachedBy || '',
          Remarks: f.remarks || '',
          AttachedAt: f.attachedAt || new Date().toISOString()
        })),
        Addresses: this.addressList.map((a: any) => ({
          Id: a.id || 0,
          VendorCompanyId: this.companyId || 0,
          Street: a.street,
          City: a.city,
          State: a.state,
          Zip: a.zip,
          Country: a.country,
          IsPrimary: a.isPrimary
        })),
        Contacts: this.contactList.map((c: any) => ({
          Id: c.id || 0,
          VendorCompanyId: this.companyId || 0,
          Description: c.description,
          Type: c.type,
          ContactNumber: c.contactNumber,
          Extension: c.extension,
          IsPrimary: c.isPrimary
        })),
        PurchasingDemographics: {
          Id: 0,
          VendorCompanyId: this.companyId || 0,
          PrimaryCurrency: this.primaryCurrency,
          PrimaryContactId: 0,
          VendorType: this.vendorCategory,
          LineOfBusiness: this.lineOfBusiness,
          BirthCountry: '',
          EmployeeResponsible: this.employeeResponsible,
          Segment: '',
          Speciality: '',
          Chain: '',
          Note: this.note
        }
      },
      VendorUserId: this.vendorId
    };

    this.companyService.updateCompany(this.companyId, payload).subscribe({
      next: () => {
        this.message = requestStatusId === 2 
            ? 'Company Approved Successfully!' 
            : 'Company Recalled Successfully!';
        this.isLoading = false;
        this.router.navigate(['/company']);
      },
      error: (err) => {
        console.error('Error updating company:', err);
        this.error = 'Failed to update company!';
        this.isLoading = false;
      }
    });
  }

  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  }

  goBack() {
    this.router.navigate(['/company']);
  }
}
