import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyService } from 'app/shared/services/Company.services';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CompanyActionsComponent } from '../company-actions/company-actions.component';

import { finalize } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { SystemService } from 'app/shared/services/system.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-company-edit',
  templateUrl: './company-edit.component.html',
  styleUrls: ['./company-edit.component.scss'],
  standalone: false,
})
export class CompanyEditComponent implements OnInit {
  companyId: number | null = null;
  procurementCompanyId: number | null = null;
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
  purchasingDemographicsList: any[] = [];
  bankDetailsList: any[] = [];
  isEditMode: boolean = false;
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  isAssigned: boolean = null;
  workflowMasterId: number = 0;
  mainApproverId: string = '';
  currentUserId: string = '';
  error: string = '';
  remark: string = '';
  message: string = '';
  actionType!: string;
  vendorEntityAssociationId: number | null = null;
  submitterId: string = '';
  private modalRef!: NgbModalRef;
  companyStatusLabel: string | null = null;
  companyStatusClass: string = '';
  selectedTab: string = 'general-info';

  associatedEntities: any[] = [];

  companyLogoUrl: string | null = null;
  companyWebsite: string | null = null;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private systemService: SystemService
  ) { }

  // ngOnInit(): void {
  //   this.route.queryParams.subscribe(params => {
  //     if (params['id']) {
  //       this.companyId = +params['id'];
  //       this.vendorEntityAssociationId = +params['vendorEntityAssociationId'];

  //       // ✅ Get isAssigned from query parameters
  //       this.isAssigned = params['isAssigned'] === 'true' || params['isAssigned'] === true;
  //       console.log('Is Assigned from query params:', this.isAssigned);

  //       this.procurementCompanyId = params['procurementCompanyId'] ? +params['procurementCompanyId'] : null;
  //       this.loadCompanyById(this.companyId);
  //     }
  //   });
  // }

  ngOnInit(): void {
    this.currentUserId = localStorage.getItem('userId') || '';
    this.route.queryParams.subscribe(params => {
      console.log('=== QUERY PARAMS DEBUG ===');
      console.log('All params:', params);
      console.log('isAssigned value:', params['isAssigned']);
      console.log('isAssigned type:', typeof params['isAssigned']);
      console.log('isAssigned === "true":', params['isAssigned'] === 'true');
      console.log('isAssigned === true:', params['isAssigned'] === true);
      console.log('=== END DEBUG ===');

      // Parse company ID and vendor association ID
      if (params['id']) {
        this.companyId = +params['id'];
        this.vendorEntityAssociationId = params['vendorEntityAssociationId']
          ? +params['vendorEntityAssociationId']
          : null;

        // Parse isAssigned safely
        // Query params are usually strings, but could be booleans depending on navigation
        const isAssignedVal = params['isAssigned'];
        this.isAssigned = isAssignedVal === 'true' || isAssignedVal === true || isAssignedVal === '1';
        console.log('Final isAssigned value from params:', this.isAssigned);

        // Parse procurementCompanyId if present
        this.procurementCompanyId = params['procurementCompanyId']
          ? +params['procurementCompanyId']
          : null;

        // Now load company data
        this.loadCompanyById(this.companyId);
      }
    });
  }
  selectTab(tabKey: string): void {
    this.selectedTab = tabKey;
  }

  loadCompanyById(id: number) {
    this.error = '';
    this.message = '';
    this.spinner.show();

    this.companyService
      .getVendorCompanyById(id)
      .pipe(
        finalize(() => {
          this.spinner.hide();
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res: any) => {
          console.log('API Response (loadCompanyById):', res);

          // Handle potential 'result' wrapper from API
          const company = res?.result?.vendorCompany || res?.result || res?.vendorCompany || res;
          console.log('Resolved Company Object:', company);

          if (!company) {
            this.isLoading = false;
            return;
          }

          // --- Basic Company Info ---
          this.companyId = company.id || 0;
          this.companyGUID = company.companyGUID || null;
          this.submitterId = company.submitterId || '';
          this.companyName = company.name || '';
          this.aboutCompany = company.aboutCompany || '';
          this.companyStatusLabel = company.requestStatus || '';
          this.companyStatusClass = this.mapCompanyStatusClass(company.requestStatusId);

          if (company.logo) {
            if (typeof company.logo === 'string' && !company.logo.startsWith('data:image')) {
              this.companyLogoUrl = `data:image/png;base64,${company.logo}`;
            } else {
              this.companyLogoUrl = company.logo;
            }
          } else {
            this.companyLogoUrl = null;
          }
          this.companyWebsite = company.websiteUrl || null;
          this.workflowMasterId = company.workflowMasterId || 0;
          this.mainApproverId = company.mainApproverId || '';

          // If vendorEntityAssociationId is missing from query params, try to get it from API response
          if (!this.vendorEntityAssociationId) {
            this.vendorEntityAssociationId = company.vendorEntityAssociationId || null;
            console.log('Resolved vendorEntityAssociationId from API response:', this.vendorEntityAssociationId);
          }

          // If isAssigned is null or false, try to get it from the company object
          if (this.isAssigned === null || this.isAssigned === false) {
            this.isAssigned = company.isAssigned || false;
            console.log('Updated isAssigned from API response:', this.isAssigned);
          }
          // this.remarks = company.remarks || '';
          // this.companyForm.patchValue({ remarks: this.remarks });

          // --- Purchasing Demographics (single object) ---
          const demographics = company.vendorCompanyPurchasingDemographics || null;
          this.purchasingDemographicsList = demographics
            ? [
              {
                vendorType: demographics.vendorType,
                primaryCurrency: demographics.primaryCurrency,
                lineOfBusiness: demographics.lineOfBusiness,
                employeeResponsible: demographics.employeeResponsible,
                note: demographics.note,
                birthCountry: demographics.birthCountry,
                segment: demographics.segment,
                speciality: demographics.speciality,
                chain: demographics.chain,
              },
            ]
            : [];

          console.log('Purchasing Demographics List:', this.purchasingDemographicsList);

          // --- Bank Details ---
          const rawBankDetails = company.vendorBankDetails || [];
          this.bankDetailsList = rawBankDetails.map((b: any) => ({
            id: b.id,
            bankName: b.bankName,
            branchName: b.branchName,
            branchAddress: b.branchAddress,
            accountHolderName: b.accountHolderName,
            accountNumber: b.accountNumber,
            iban: b.IBAN || b.iban,
            swifT_BIC_Code: b.swifT_BIC_Code || b.swiftCode,
            country: b.country,
            currency: b.currency,
            isPrimary: b.isPrimary || false,
          }));

          // --- Addresses ---
          const rawAddresses = company.vendorCompanyAddresses || [];
          this.addressList = rawAddresses.map((a: any) => ({
            id: a.id,
            street: a.street,
            city: a.city,
            state: a.state,
            zip: a.zip,
            country: a.country,
            isPrimary: a.isPrimary || false,
          }));

          // --- Contacts ---
          const rawContacts = company.vendorCompanyContactDetails || [];
          this.contactList = rawContacts.map((c: any) => ({
            id: c.id,
            description: c.description,
            type: c.type,
            contactNumber: c.contactNumber,
            extension: c.extension,
            isPrimary: c.isPrimary || false,
          }));

          // --- Attachments ---
          this.attachedFiles = (company.vendorCompanyAttachments || []).map((f: any) => ({
            id: f.id,
            fileName: f.fileName,
            format: f.fileFormat,
            fileContent: f.fileContent,
            attachedBy: f.attachedBy,
            remarks: f.remarks,
            attachedAt: f.attachedAt,
          }));

          // --- Vendor Entities (Procurement Companies) ---
          // const rawEntities = company.vendorUserCompanies || [];
          // this.associatedEntities = rawEntities.map((v: any) => ({
          //   id: v.id,
          //   procurementCompanyId: v.procurementCompanyId,
          //   name: v.procurementCompanyName || '',
          //   city: v.procurementCompany?.city || '',
          //   country: v.procurementCompany?.country || '',
          //   industry: v.procurementCompany?.industry || '',
          //   statusLabel: v.requestStatus || '',
          //   statusClass: this.mapStatusClass(v.requestStatusId),
          //   isAssigned: v.isAssigned || false,
          //   requestStatusId: v.requestStatusId,
          // }));

          // // Auto-select first entity if available
          // if (this.associatedEntities.length > 0) {
          //   this.onEntitySelect(this.associatedEntities[0]);
          // } else {
          //   this.isReadonlyEntityFields = false;
          //   this.bankForm.enable();
          //   this.companyForm.enable();
          // }

          this.isEditMode = true;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading company:', err);
          this.error = 'Failed to load company.';
          this.isLoading = false;
          // this.isReadonlyEntityFields = false;
          // this.bankForm.enable();
          // this.companyForm.enable();
        },
      });
  }

  mapCompanyStatusClass(statusId: number): string {
    switch (statusId) {
      case 12: // Onboarded
        return 'company-status-onboarded';
      case 1: // In progress
        return 'company-status-inprogress';
      case 8: // New
        return 'company-status-new';
      default:
        return 'company-status-default';
    }
  }

  mapStatusClass(statusId: number): string {
    // adjust mappings as per your CSS / enum
    switch (statusId) {
      case 7: // Completed
        return 'status-onboarded';
      case 1: // In progress
        return 'status-pending';
      case 8: // New
        return 'status-in-process';
      default:
        return 'status-default';
    }
  }

  normalizeWebsite(url: string | null): string | null {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    return 'https://' + url;
  }

  // onActions(action: string): void {
  //   const modalRef = this.modalService.open(CompanyActionsComponent, {
  //     size: 'lg',
  //     backdrop: 'static',
  //     centered: true
  //   });

  //   modalRef.componentInstance.action = action;

  //   modalRef.result.then(
  //     (result) => {
  //       if (result) {
  //         this.isLoading = true;

  //         const payload = {
  //           vendorCompanyId: this.companyId,
  //           procurementCompanyId: this.procurementCompanyId || 0,
  //           actionTaken: action,       // separate action
  //           remarks: result.remarks,   // plain string from modal
  //           approverId: localStorage.getItem('userId') || ''
  //         };

  //         this.companyService.VendorCompanyAction(payload).subscribe({
  //           next: (res) => {
  //             this.isLoading = false;
  //                this.message =
  //               action === 'Approve'
  //                 ? 'Company Approved Successfully!'
  //                 : action === 'Reject'
  //                   ? 'Company Rejected Successfully!'
  //                   : action === 'SubmitForApproval'
  //                     ? 'Company Submitted for Approval Successfully!'
  //                     : 'Company Sent Back Successfully!';
  //             this.cdr.detectChanges();
  //             this.router.navigate(['/company']);
  //           },
  //           error: (err) => {
  //             this.isLoading = false;
  //             this.error = 'Failed to perform action!';
  //             console.error(err);
  //           }
  //         });
  //       }
  //     },
  //     (reason) => {
  //       console.log(`Modal dismissed: ${reason}`);
  //     }
  //   );
  // }

  onActions(action: string): void {
    // Always direct for sendforapproval
    if (action === 'sendforapproval') {
      Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to submit this company for approval?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#116AEF',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Submit'
      }).then((result) => {
        if (result.isConfirmed) {
          this.submitForApproval(action);
        }
      });
      return;
    }

    // ✅ IF isAssigned (from query params) AND Approve → Direct API
    if (this.isAssigned && action === 'Approve') {
      this.submitForApproval(action);
      return;
    }

    // For Reject / SendBack when isAssigned → open modal and send remarks to takeAction()
    const modalRef = this.modalService.open(CompanyActionsComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });

    modalRef.componentInstance.action = action;

    modalRef.result.then(
      (result) => {
        if (!result && action !== 'Approve') return;

        if (this.isAssigned) {
          // Assigned: Reject or SendBack with remarks
          this.submitForApproval(action, result?.remarks || '');
        } else {
          // Normal flow
          this.performCompanyAction(action, result.remarks);
        }
      },
      (reason) => {
        console.log(`Modal dismissed: ${reason}`);
      }
    );
  }

  private performCompanyAction(action: string, remarks: string) {
    this.isSubmitting = true;
    this.spinner.show();

    const payload = {
      vendorCompanyId: this.companyId,
      RequesterId: this.submitterId,
      procurementCompanyId: this.procurementCompanyId || 0,
      actionTaken: action,
      remarks,
      approverId: localStorage.getItem('userId') || '',
    };

    this.companyService.VendorCompanyAction(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.spinner.hide();
        this.message =
          action === 'Approve'
            ? 'Company Approved Successfully!'
            : action === 'Rejected'
              ? 'Company Rejected Successfully!'
              : 'Company Sent Back Successfully!';
        this.toastr.success(res.message || this.message);
        this.cdr.detectChanges();
        this.router.navigate(['/company']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.spinner.hide();
        this.error = 'Failed to perform action!';
        this.toastr.error(err.error?.message || this.error);
        console.error(err);
      },
    });
  }

  private submitForApproval(action: string, remarks: string = ''): void {
    this.isLoading = true;
    this.isSubmitting = true;
    this.spinner.show();

    const payload = {
      vendorCompanyId: this.companyId,
      approverId: localStorage.getItem('userId') || '',
      procurementCompanyId: this.procurementCompanyId || 0,
      Action: action,
      RequesterId: this.submitterId,
      vendorEntityAssociationId: this.vendorEntityAssociationId,
      remarks: remarks,
    };

    this.companyService.takeAction(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.message =
          action === 'sendforapproval'
            ? 'Submit for approval Success'
            : `Company ${action} Successfully!`;
        // Prioritize local message to avoid backend messages that might contain user IDs or other details
        this.toastr.success(this.message);
        this.cdr.detectChanges();
        this.router.navigate(['/company']);
      },
      error: (err) => {
        this.isLoading = false;
        this.isSubmitting = false;
        this.spinner.hide();
        console.error(err);
        this.toastr.error(err.error?.message || 'Failed to perform action!');
        this.error = 'Failed to perform action!';
      },
    });
  }

  // downloadAttachment(file: any) {
  //   if (!file?.fileContent) {
  //     this.message = 'File content not available for download.';
  //     return;
  //   }
  //   const byteCharacters = atob(file.fileContent);
  //   const byteNumbers = new Array(byteCharacters.length);
  //   for (let i = 0; i < byteCharacters.length; i++) {
  //     byteNumbers[i] = byteCharacters.charCodeAt(i);
  //   }
  //   const byteArray = new Uint8Array(byteNumbers);
  //   const blob = new Blob([byteArray], { type: file.format || 'application/octet-stream' });
  //   const url = window.URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = file.fileName || 'attachment';
  //   a.click();
  //   window.URL.revokeObjectURL(url);
  // }
  downloadAttachment(attachment: any) {
    if (!attachment) return;

    const fileName = attachment.fileName || 'download';

    // if (attachment.isNew) {
    //   // Frontend-only download
    //   const dataUrl = `data:${attachment.contentType};base64,${attachment.content}`;
    //   const link = document.createElement('a');
    //   link.href = dataUrl;
    //   link.download = fileName;
    //   link.click();
    // } else {
    // Saved attachment → download via service
    this.systemService.downloadAttachment('VendorCompany', attachment.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastr.error('Failed to download attachment.');
      },
    });
  }

  goBack() {
    this.router.navigate(['/company']);
  }
}