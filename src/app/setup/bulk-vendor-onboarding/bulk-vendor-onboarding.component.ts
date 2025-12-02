import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { Company, CompaniesRow, AddressDetail, AddressRow, ContactDetail, ContactRow, BankDetail, BankRow, DemographicDetail, AttachmentDetail, DemographicsRow } from './bulk-companies.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-bulk-vendor-onboarding',
  templateUrl: './bulk-vendor-onboarding.component.html',
  styleUrls: ['./bulk-vendor-onboarding.component.scss']
})
export class BulkVendorOnboardingComponent implements OnInit {
  selectedFile: File | null = null;
  company: Company | null = null;
  isParsing = false;
  private attachmentCounter = 1;
  isScrolled = false;
  constructor(private cdr: ChangeDetectorRef, private toastr:ToastrService){

  }

  ngOnInit(): void {
    
  }

  get hasCompany(): boolean {
    return !!this.company;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) {
      return;
    }

    this.selectedFile = file;
    this.company = null;
     this.isParsing = true; 
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });

      const companiesSheet = workbook.Sheets['Companies'];
      const addressesSheet = workbook.Sheets['Addresses'];
      const contactsSheet = workbook.Sheets['Contacts'];
      const bankSheet = workbook.Sheets['BankDetails'];
      const demographicSheet = workbook.Sheets['Demographics'];

      if (!companiesSheet) {
        this.toastr.warning('Sheet "Companies" not found.');

           this.isParsing = false;
           this.cdr.markForCheck();
        return;
      }
      const companiesRows = XLSX.utils.sheet_to_json<CompaniesRow>(companiesSheet, { defval: '' });
      if (!companiesRows.length) {
        this.toastr.warning('No company rows found in "Companies" sheet.');
           this.isParsing = false;
               this.cdr.markForCheck();
        return;
      }

      const firstCompanyRow = companiesRows[0];
      const companyKey = (firstCompanyRow.CompanyKey || '').trim();
      if (!companyKey) {
        this.toastr.warning('CompanyKey is required in Companies sheet.');
           this.isParsing = false;
               this.cdr.markForCheck();
        return;
      }

      let addresses: AddressDetail[] = [];
      if (addressesSheet) {
        const addressRows = XLSX.utils.sheet_to_json<AddressRow>(addressesSheet, { defval: '' });
        addresses = addressRows
          .filter(r => (r.CompanyKey || '').trim() === companyKey)
          .map((r, index) => ({
            id: index + 1,
            street: (r.Street || '').trim(),
            isPrimary: (r.IsPrimary || '').trim(),
            city: (r.City || '').trim(),
            state: (r.State || '').trim(),
            country: (r.Country || '').trim(),
            zip: (r.Zip || '').trim()
          }))
          .filter(a => a.country || a.city); 
      }

      let contacts: ContactDetail[] = [];
      if (contactsSheet) {
        const contactRows = XLSX.utils.sheet_to_json<ContactRow>(contactsSheet, { defval: '' });
        contacts = contactRows
          .filter(r => (r.CompanyKey || '').trim() === companyKey)
          .map((r, index) => {
            const isPrimaryStr = (r.IsPrimary || '').trim();
            const isPrimary =
              isPrimaryStr.toLowerCase() === 'yes' ||
              isPrimaryStr.toLowerCase() === 'true' ||
              isPrimaryStr === '1';

            return {
              id: index + 1,
              description: (r.Description || '').trim(),
              type: (r.Type || '').trim(),
              email: (r.Email || '').trim(),
              phone: (r.Phone || '').trim(),
              isPrimary
            } as ContactDetail;
          })
          .filter(c => c.description || c.email || c.phone);
      }

      let bankDetails: BankDetail[] = [];
      if (bankSheet) {
        const bankRows = XLSX.utils.sheet_to_json<BankRow>(bankSheet, { defval: '' });
        bankDetails = bankRows
          .filter(r => (r.CompanyKey || '').trim() === companyKey)
          .map((r, index) => ({
            id: index + 1,
            bankName: (r.BankName || '').trim(),
            accountHolderName: (r.AccountHolderName || '').trim(),
            accountNumber: (r.AccountNumber || '').trim(),
            iban: (r.IBAN || '').trim(),
            swifT_BIC_Code: (r.SwiftCode || '').trim(),
            branchName: (r.BranchName || '').trim(),
            branchAddress: (r.BranchAddress || '').trim(),
            country: (r.Country || '').trim(),
            currency: (r.Currency || '').trim()
          }))
          .filter(b => b.bankName || b.accountNumber || b.iban);
      }

   
      const demographicRows: DemographicsRow[] = XLSX.utils.sheet_to_json(demographicSheet);
      const firstDemoRow = demographicRows[0];
      let demographics: DemographicDetail | null = null;
      if (
        firstDemoRow?.VendorType ||
        firstDemoRow?.PrimaryCurrency ||
        firstDemoRow?.LineOfBusiness ||
        firstDemoRow?.EmployeeResponsible ||
        firstDemoRow?.Note
      ) {
        demographics = {
          vendorType: (firstDemoRow.VendorType || '').trim(),
          primaryCurrency: (firstDemoRow.PrimaryCurrency || '').trim(),
          lineOfBusiness: (firstDemoRow.LineOfBusiness || '').trim(),
          employeeResponsible: (firstDemoRow.EmployeeResponsible || '').trim(),
          note: (firstDemoRow.Note || '').trim(),
        };
      }

      const nowIso = new Date().toISOString();

      this.company = {
        companyGUID: companyKey, 
        name: (firstCompanyRow.Name || '').trim(),
        logo: '',
        remarks: (firstCompanyRow.Remarks || '').trim(),
        // requestStatusId: 0,
        // requestStatus: {
        //   status: 'Imported',
        //   id: 0,
        //   createdDate: nowIso,
        //   modifiedDate: nowIso,
        //   createdBy: null,
        //   modifiedBy: null,
        //   isDeleted: false
        // },
        bankDetails,
        addresses,
        contacts,
        demographics,
        attachments: []
        
      };
         this.isParsing = false;
          this.cdr.detectChanges();
    };
  
    reader.readAsArrayBuffer(file);
  }

    @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const threshold = 240;
    this.isScrolled = window.scrollY > threshold;
  }
  onChangeFile(): void {
    this.selectedFile = null;
    this.company = null;
  }


  onClearPreview(): void {
    this.selectedFile = null;
    this.company = null;
    this.attachmentCounter = 1;
  }

  onConfirmImport(): void {
    console.log('Confirm & import (demo)', this.company);
    alert('Import (demo) – check console for payload.');
  }

  onAttachmentSelected(event: Event): void {
    if (!this.company) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) {
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const attachment: AttachmentDetail = {
        id: this.attachmentCounter++,
        fileName: file.name,
        fileType: file.type || 'file',
        sizeInKb: Math.round(file.size / 1024),
        file
      };

      this.company.attachments.push(attachment);
    }

    input.value = '';
  }

  getInitials(name: string | null | undefined): string {
    if (!name) return '?';
    return name
      .split(' ')
      .filter(x => !!x)
      .map(x => x[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  onRemoveAttachment(attachment: AttachmentDetail): void {
  if (!this.company) {
    return;
  }

  this.company.attachments = this.company.attachments.filter(a => a.id !== attachment.id);

  this.cdr.markForCheck();
}
}
