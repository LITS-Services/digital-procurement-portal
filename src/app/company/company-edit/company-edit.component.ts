import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyService } from 'app/shared/services/Company.services';

@Component({
  selector: 'app-company-edit',
  templateUrl: './company-edit.component.html',
  styleUrls: ['./company-edit.component.scss']
})
export class CompanyEditComponent implements OnInit {

  companyId: number | null = null;
  vendorId: string = '';   // ✅ added vendorId
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
  remark: string = ''; // For review remark

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.companyId = +params['id'];
        this.loadCompanyById(this.companyId);
      }
    });
  }

  // 🔹 Load company data
  loadCompanyById(id: number) {
    this.isLoading = true;
    this.error = '';

    this.companyService.getCompanyById(id).subscribe({
      next: (res: any) => {
        const company = res?.vendorCompany || res;
        if (company) {
          this.companyId = company.id || 0;
          this.vendorId = company.vendorId || this.companyId?.toString() || ''; // ✅ capture vendorId safely
          this.companyName = company.name || '';
          this.aboutCompany = company.aboutCompany || '';
          this.vendorCategory = company.purchasingDemographics?.vendorType || '';
          this.primaryCurrency = company.purchasingDemographics?.primaryCurrency || '';
          this.lineOfBusiness = company.purchasingDemographics?.lineOfBusiness || '';
          this.employeeResponsible = company.purchasingDemographics?.employeeResponsible || '';
          this.note = company.purchasingDemographics?.note || '';

          // Addresses
          this.addressList = (company.addresses?.$values || []).map(a => ({
            id: a.id,
            street: a.street,
            city: a.city,
            state: a.state,
            zip: a.zip,
            country: a.country,
            isPrimary: a.isPrimary
          }));

          // Contacts
          this.contactList = (company.contacts?.$values || []).map(c => ({
            id: c.id,
            description: c.description,
            type: c.type,
            contactNumber: c.contactNumber,
            extension: c.extension,
            isPrimary: c.isPrimary
          }));

          // Attachments
          this.attachedFiles = (company.attachments?.$values || []).map(f => ({
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

  // 🔹 Download attachment
  downloadAttachment(file: any) {
    if (!file?.fileContent) {
      alert('File not available.');
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

  // 🔹 Approve (3) or Recall (1)
  async reviewCompany(requestStatusId: number) {
    if (!this.companyId) {
      alert('Company ID missing!');
      return;
    }

    this.isLoading = true;

    // Ensure attachments are Base64 if uploading new ones
    this.attachedFiles = await Promise.all(this.attachedFiles.map(async f => {
      if (f.file && !f.fileContent) {
        f.fileContent = await this.convertFileToBase64(f.file);
      }
      return f;
    }));

    // ✅ Get ApprovedBy (userId) from localStorage
    const ApproverId = localStorage.getItem('userId') || '';

    const payload = {
      id: this.companyId || 0,
      companyGUID: '', 
      name: this.companyName,
      logo: '', 
      remarks: this.remark, 
      requestStatusId: requestStatusId, 
      vendorId: this.vendorId || '', // ✅ send vendorId
      ApproverId: ApproverId, 
      attachments: this.attachedFiles.map(f => ({
        id: f.id || 0,
        vendorCompanyId: this.companyId || 0,
        fileName: f.fileName,
        fileFormat: f.format,
        fileContent: f.fileContent,
        attachedBy: f.attachedBy || '',
        remarks: f.remarks || '',
        attachedAt: f.attachedAt || new Date().toISOString()
      })),
      addresses: this.addressList.map(a => ({
        id: a.id || 0,
        vendorCompanyId: this.companyId || 0,
        street: a.street,
        city: a.city,
        state: a.state,
        zip: a.zip,
        country: a.country,
        isPrimary: a.isPrimary
      })),
      contacts: this.contactList.map(c => ({
        id: c.id || 0,
        vendorCompanyId: this.companyId || 0,
        description: c.description,
        type: c.type,
        contactNumber: c.contactNumber,
        extension: c.extension,
        isPrimary: c.isPrimary
      })),
      purchasingDemographics: {
        id: 0,
        vendorCompanyId: this.companyId || 0,
        primaryCurrency: this.primaryCurrency,
        primaryContactId: 0,
        vendorType: this.vendorCategory,
        lineOfBusiness: this.lineOfBusiness,
        birthCountry: '', // optional
        employeeResponsible: this.employeeResponsible,
        segment: '',
        speciality: '',
        chain: '',
        note: this.note
      }
    };

    this.companyService.updateCompany(this.companyId, payload).subscribe({
      next: () => {
        alert(requestStatusId === 3 ? 'Company Approved Successfully!' : 'Company Recalled Successfully!');
        this.isLoading = false;
        this.router.navigate(['/company']);
      },
      error: (err) => {
        console.error('Error updating company:', err);
        alert('Failed to update company!');
        this.isLoading = false;
      }
    });
  }

  // 🔹 File -> Base64
  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  }

  // 🔹 Back button
  goBack() {
    this.router.navigate(['/company']);
  }

}
