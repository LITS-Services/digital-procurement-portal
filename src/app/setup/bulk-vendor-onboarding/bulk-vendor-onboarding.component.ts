import { ChangeDetectorRef, Component, HostListener, NgZone, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { Company, CompaniesRow, AddressDetail, AddressRow, ContactDetail, ContactRow, BankDetail, BankRow, DemographicDetail, AttachmentDetail, DemographicsRow, UsersDetail, UserRow } from './bulk-companies.model';
import { ToastrService } from 'ngx-toastr';
import { CompanyService } from 'app/shared/services/Company.services';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-bulk-vendor-onboarding',
  templateUrl: './bulk-vendor-onboarding.component.html',
  styleUrls: ['./bulk-vendor-onboarding.component.scss'],
  standalone: false
})
export class BulkVendorOnboardingComponent implements OnInit {
  selectedFile: File | null = null;
  company: Company | null = null;
  isParsing = false;
  private attachmentCounter = 1;
  isScrolled = false;

  entitiesList = [];

  tenderingData = [];
  selectedEntityIds: number[] = [];
  constructor(
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private companyService: CompanyService,
    private router:Router,
    public spinner:NgxSpinnerService,
      private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.loadCompanyData();
  }

  get hasCompany(): boolean {
    return !!this.company;
  }

  get selectedEntities() {
    return this.entitiesList.filter((e) => this.selectedEntityIds.includes(e.id));
  }

  removeEntity(id: number) {
    this.selectedEntityIds = this.selectedEntityIds.filter((x) => x !== id);
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
      const usersSheet = workbook.Sheets['Users'];
      const demographicSheet = workbook.Sheets['Demographics'];

      if (!companiesSheet) {
         this.ngZone.run(() => {
           this.toastr.warning('Sheet "Companies" not found.');
         });

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
          .filter((r) => (r.CompanyKey || '').trim() === companyKey)
          .map((r, index) => ({
            id: index + 1,
            street: (r.Street || '').trim(),
            isPrimary: (r.IsPrimary || '').trim(),
            city: (r.City || '').trim(),
            state: (r.State || '').trim(),
            country: (r.Country || '').trim(),
            zip: (r.Zip || '').trim(),
          }))
          .filter((a) => a.country || a.city);
      }

      let users: UsersDetail[] = [];
      if (usersSheet) {
        const userRows = XLSX.utils.sheet_to_json<UserRow>(usersSheet, { defval: '' });
        users = userRows
          .map((r, index) => ({
            userName: (r.UserName || '').trim(),
            userEmail: (r.UserEmail || '').trim(),
          }))
          .filter((u) => u.userEmail);
      }

      let contacts: ContactDetail[] = [];
      if (contactsSheet) {
        const contactRows = XLSX.utils.sheet_to_json<ContactRow>(contactsSheet, { defval: '' });
        contacts = contactRows
          .filter((r) => (r.CompanyKey || '').trim() === companyKey)
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
              isPrimary,
            } as ContactDetail;
          })
          .filter((c) => c.description || c.email || c.phone);
      }

      let bankDetails: BankDetail[] = [];
      if (bankSheet) {
        const bankRows = XLSX.utils.sheet_to_json<BankRow>(bankSheet, { defval: '' });
        bankDetails = bankRows
          .filter((r) => (r.CompanyKey || '').trim() === companyKey)
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
            currency: (r.Currency || '').trim(),
          }))
          .filter((b) => b.bankName || b.accountNumber || b.iban);
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
        users,
        demographics,
        attachments: [],
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
    this.selectedEntityIds = [];
    this.selectedFile = null;
    this.company = null;
  }

  onClearPreview(): void {
    this.selectedFile = null;
    this.company = null;
    this.attachmentCounter = 1;
  }

  async onConfirmImport(): Promise<void> {
    if (!this.company) {
      this.toastr.error('No company data found. Please upload and parse the Excel file first.');
      return;
    }

    if (!this.selectedEntityIds || this.selectedEntityIds.length === 0) {
      this.toastr.warning('Please select at least one entity before saving.');
      return;
    }

    this.spinner.show();

    const nowIso = new Date().toISOString();

    // Simple inline helper to convert File -> base64 (without data:... prefix)
    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // result is like: data:application/pdf;base64,XXXXX
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    // ---- Attachments mapping with Base64 ----
    const attachments =
      this.company.attachments && this.company.attachments.length
        ? await Promise.all(
            this.company.attachments.map(async (att: any) => {
              if (!att.file) {
                return null;
              }

              const base64 = await fileToBase64(att.file);

              return {
                id: 0,
                vendorCompanyId: 0,
                fileName: att.fileName,
                fileFormat: att.fileType || 'file',
                fileContent: base64,
                attachedBy: null,
                remarks: '',
                attachedAt: nowIso,
              };
            })
          )
        : [];

    const filteredAttachments = attachments.filter((a) => !!a);

    // ---- Main company payload mapping ----
    const apiCompany: any = {
      id: 0,
      createdDate: nowIso,
      modifiedDate: nowIso,
      createdBy: null,
      modifiedBy: null,
      isDeleted: false,
      companyGUID: this.company.companyGUID,
      name: this.company.name,
      logo: this.company.logo || '',
      userEmail:
        this.company.users && this.company.users.length
          ? this.company.users[0].userEmail
          : (this.company as any).userEmail || '',
      remarks: this.company.remarks || '',

      bankDetails: (this.company.bankDetails || []).map((b: any) => ({
        id: 0,
        createdDate: nowIso,
        modifiedDate: nowIso,
        createdBy: null,
        modifiedBy: null,
        isDeleted: false,
        vendorCompanyId: 0,
        bankName: b.bankName,
        accountHolderName: b.accountHolderName,
        accountNumber: b.accountNumber,
        iban: b.iban,
        swifT_BIC_Code: b.swifT_BIC_Code,
        branchName: b.branchName,
        branchAddress: b.branchAddress,
        country: b.country,
        currency: b.currency,
      })),

      addresses: (this.company.addresses || []).map((a: any) => ({
        id: 0,
        vendorCompanyId: 0,
        street: a.street,
        city: a.city,
        state: a.state,
        zip: a.zip,
        country: a.country,
        isPrimary: ['yes', 'true', '1'].includes(String(a.isPrimary).trim().toLowerCase()),
      })),

      contacts: (this.company.contacts || []).map((c: any) => ({
        id: 0,
        vendorCompanyId: 0,
        description: c.description,
        type: c.type,
        contactNumber: c.phone, // your Excel "Phone" mapped here
        extension: '',
        isPrimary: c.isPrimary === true,
      })),

      demographics: this.company.demographics
        ? {
            id: 0,
            createdDate: nowIso,
            modifiedDate: nowIso,
            createdBy: null,
            modifiedBy: null,
            isDeleted: false,
            vendorCompanyId: 0,
            primaryCurrency: this.company.demographics.primaryCurrency || '',
            primaryContactId: 0,
            vendorType: this.company.demographics.vendorType || '',
            lineOfBusiness: this.company.demographics.lineOfBusiness || '',
            birthCountry: '',
            employeeResponsible: this.company.demographics.employeeResponsible || '',
            segment: '',
            speciality: '',
            chain: '',
            note: this.company.demographics.note || '',
          }
        : null,

      attachments: filteredAttachments,
    };

    const payload = {
      company: apiCompany,
      procurementCompanyId: this.selectedEntityIds, // e.g. [1, 3, 4]
    };

    // ---- Call API ----
    this.companyService.registerCompanyInBulk(payload).subscribe({

      next: (res: any) => {

      if (typeof res === 'number') {
        this.toastr.success('Companies successfully submitted.');
        this.spinner.hide();
        this.onClearPreview();
        this.selectedEntityIds = [];
        this.router.navigate(['/company']);
        return;
      }
      
      this.spinner.hide();

      },
      error: (err: any) => {
         this.spinner.hide();
        console.error('Error registering company in bulk:', err);
      },
    });
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
        file,
      };

      this.company.attachments.push(attachment);
    }

    input.value = '';
  }

  loadCompanyData() {
    this.companyService.getProCompanies().subscribe({
      next: (res: any) => {
        const companies = res?.result || [];

        // Keep your original mapping
        this.tenderingData = companies.map((c: any) => ({
          ...c,
          status: c.isDeleted ? 'Inactive' : 'Active',
          logo: c.logo || '',
        }));

        // 👉 Build entitiesList for the dropdown (only active ones)
        this.entitiesList = this.tenderingData
          .filter((x: any) => !x.isDeleted) // optional: only active
          .map((x: any) => ({
            id: x.id ?? x.companyId, // support both id or companyId
            name: x.name,
            city: x.city,
            country: x.country,
            raw: x, // keep full object if needed later
          }));

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching companies:', err);
      },
    });
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  getInitials(name: string | null | undefined): string {
    if (!name) return '?';
    return name
      .split(' ')
      .filter((x) => !!x)
      .map((x) => x[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  onRemoveAttachment(attachment: AttachmentDetail): void {
    if (!this.company) {
      return;
    }

    this.company.attachments = this.company.attachments.filter((a) => a.id !== attachment.id);

    this.cdr.markForCheck();
  }
}
