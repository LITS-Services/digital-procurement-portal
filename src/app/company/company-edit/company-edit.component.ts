import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyService } from 'app/shared/services/Company.services';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CompanyActionsComponent } from '../company-actions/company-actions.component';
import { Action } from 'rxjs/internal/scheduler/Action';
import { finalize } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-company-edit',
  templateUrl: './company-edit.component.html',
  styleUrls: ['./company-edit.component.scss']
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
  isAssigned: boolean = null;
  error: string = '';
  remark: string = '';
  message: string = '';
  actionType!: string;
  vendorEntityAssociationId: number | null = null;
  submitterId: string = '';
  private modalRef!: NgbModalRef;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,


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
        this.vendorEntityAssociationId = params['vendorEntityAssociationId'] ? +params['vendorEntityAssociationId'] : null;

        // Parse isAssigned safely
        // Query params are always strings, so compare with "true"
        this.isAssigned = params['isAssigned'] === 'true';
        console.log('Final isAssigned value:', this.isAssigned);

        // Parse procurementCompanyId if present
        this.procurementCompanyId = params['procurementCompanyId'] ? +params['procurementCompanyId'] : null;

        // Now load company data
        this.loadCompanyById(this.companyId);
      }
    });
  }




  // loadCompanyById(id: number) {
  //   this.isLoading = true;
  //   this.error = '';
  //   this.message = '';

  //   this.companyService.getCompanyById(id).subscribe({
  //     next: (res: any) => {
  //       const company = res?.vendorCompany || res;
  //       if (company) {
  //         this.companyId = company.id || 0;
  //         this.companyGUID = company.companyGUID || null;
  //         this.vendorId = company.vendorId || '';
  //         this.companyName = company.name || '';
  //         this.aboutCompany = company.aboutCompany || '';
  //         this.vendorCategory = company.purchasingDemographics?.vendorType || '';
  //         this.primaryCurrency = company.purchasingDemographics?.primaryCurrency || '';
  //         this.lineOfBusiness = company.purchasingDemographics?.lineOfBusiness || '';
  //         this.employeeResponsible = company.purchasingDemographics?.employeeResponsible || '';
  //         this.note = company.purchasingDemographics?.note || '';

  //         this.addressList = (company.addresses?.$values || []).map((a: any) => ({
  //           id: a.id,
  //           street: a.street,
  //           city: a.city,
  //           state: a.state,
  //           zip: a.zip,
  //           country: a.country,
  //           isPrimary: a.isPrimary
  //         }));

  //         this.contactList = (company.contacts?.$values || []).map((c: any) => ({
  //           id: c.id,
  //           description: c.description,
  //           type: c.type,
  //           contactNumber: c.contactNumber,
  //           extension: c.extension,
  //           isPrimary: c.isPrimary
  //         }));

  //         this.attachedFiles = (company.attachments?.$values || []).map((f: any) => ({
  //           id: f.id,
  //           fileName: f.fileName,
  //           format: f.fileFormat,
  //           fileContent: f.fileContent,
  //           attachedBy: f.attachedBy,
  //           remarks: f.remarks,
  //           attachedAt: f.attachedAt
  //         }));

  //         this.isEditMode = true;
  //       }
  //       this.isLoading = false;
  //       this.cdr.markForCheck();
  //     },
  //     error: (err) => {
  //       console.error('Error loading company:', err);
  //       this.error = 'Failed to load company.';
  //       this.isLoading = false;
  //     }
  //   });
  // }


  loadCompanyById(id: number) {
    this.isLoading = true;
    this.error = '';
    this.message = '';
    this.spinner.show();


    this.companyService.getCompanyById(id)
      .pipe(finalize(() => {
        this.spinner.hide();
        this.cdr.detectChanges();
      }))

      .subscribe({
        next: (res: any) => {
          const company = res?.vendorCompany || res;

          // ✅ REMOVED: No longer setting isAssigned from API response
          // this.isAssigned = company.vendorUserCompanies?.[0]?.isAssigned ?? false;
          console.log('Is Assigned (from query params):', this.isAssigned);

          if (company) {
            this.companyId = company.id || 0;
            this.companyGUID = company.companyGUID || null;
            this.vendorId = company.vendorId || '';
            this.companyName = company.name || '';
            this.aboutCompany = company.aboutCompany || '';

            // this.vendorCategory = company.purchasingDemographics?.vendorType || '';
            // this.primaryCurrency = company.purchasingDemographics?.primaryCurrency || '';
            // this.lineOfBusiness = company.purchasingDemographics?.lineOfBusiness || '';
            // this.employeeResponsible = company.purchasingDemographics?.employeeResponsible || '';
            // this.note = company.purchasingDemographics?.note || '';

            const demographics = company.purchasingDemographics || null;
            this.purchasingDemographicsList = demographics
              ? [ // convert object → single-element array
                {
                  vendorType: demographics.vendorType,
                  primaryCurrency: demographics.primaryCurrency,
                  lineOfBusiness: demographics.lineOfBusiness,
                  employeeResponsible: demographics.employeeResponsible,
                  note: demographics.note
                }
              ]
              : [];

            console.log('Purchasing Demographics List:', this.purchasingDemographicsList);


            const rawBankDetails = company.bankDetails?.$values || company.bankDetails || [];

            this.bankDetailsList = rawBankDetails.map((b: any) => ({
              id: b.id,
              bankName: b.bankName,
              branchName: b.branchName,
              branchAddress: b.branchAddress,
              accountHolderName: b.accountHolderName,
              accountNumber: b.accountNumber,
              iban: b.iban,
              swifT_BIC_Code: b.swifT_BIC_Code,
              country: b.country,
              currency: b.currency,
            }));

            console.log('Bank Details List:', this.bankDetailsList);




            // this.addressList = (company.addresses?.$values || []).map((a: any) => ({
            //   id: a.id,
            //   street: a.street,
            //   city: a.city,
            //   state: a.state,
            //   zip: a.zip,
            //   country: a.country,
            //   isPrimary: a.isPrimary
            // }));




            const rawAddresses = company.addresses?.$values || company.addresses || [];

            this.addressList = rawAddresses.map((a: any) => ({
              id: a.id,
              street: a.street,
              city: a.city,
              state: a.state,
              zip: a.zip,
              country: a.country,
              isPrimary: a.isPrimary
            }));

            // this.contactList = (company.contacts?.$values || []).map((c: any) => ({
            //   id: c.id,
            //   description: c.description,
            //   type: c.type,
            //   contactNumber: c.contactNumber,
            //   extension: c.extension,
            //   isPrimary: c.isPrimary
            // }));


            const rawContacts = company.contacts?.$values || company.contacts || [];
            this.contactList = rawContacts.map((c: any) => ({
              id: c.id,
              description: c.description,
              type: c.type,
              contactNumber: c.contactNumber,
              extension: c.extension,
              isPrimary: c.isPrimary
            }));

            // this.attachedFiles = (company.attachments?.$values || []).map((f: any) => ({
            //   id: f.id,
            //   fileName: f.fileName,
            //   format: f.fileFormat,
            //   fileContent: f.fileContent,
            //   attachedBy: f.attachedBy,
            //   remarks: f.remarks,
            //   attachedAt: f.attachedAt
            // }));

            // this.attachedFiles = (company.attachments?.$values || []).map((f: any) => ({
            //   id: f.id,
            //   fileName: f.fileName,
            //   format: f.fileFormat,
            //   fileContent: f.fileContent,
            //   attachedBy: f.attachedBy,
            //   remarks: f.remarks,
            //   attachedAt: f.attachedAt
            // }));
            // console.log('Attachments:', this.attachedFiles);


            this.attachedFiles = (company.attachments || []).map((f: any) => ({
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
      this.submitForApproval(action);
      this.router.navigate(['/company']);
      return;
    }

    // ✅ IF isAssigned (from query params) AND Approve → Direct API
    if (this.isAssigned && action === 'Approve') {
      this.submitForApproval(action);
      this.router.navigate(['/company']);
      return;
    }

    // For Reject / SendBack when isAssigned → open modal and send remarks to takeAction()
    const modalRef = this.modalService.open(CompanyActionsComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
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
    this.isLoading = true;

    const payload = {
      vendorCompanyId: this.companyId,
      RequesterId: this.submitterId,
      procurementCompanyId: this.procurementCompanyId || 0,
      actionTaken: action,
      remarks,
      approverId: localStorage.getItem('userId') || ''
    };

    this.companyService.VendorCompanyAction(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.message =
          action === 'Approve'
            ? 'Company Approved Successfully!'
            : action === 'Rejected'
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

  private submitForApproval(action: string, remarks: string = ''): void {
    this.isLoading = true;

    const payload = {
      vendorCompanyId: this.companyId,
      approverId: localStorage.getItem('userId') || '',
      procurementCompanyId: this.procurementCompanyId || 0,
      Action: action,
      RequesterId: this.submitterId,
      vendorEntityAssociationId: this.vendorEntityAssociationId,
      remarks: remarks
    };

    this.companyService.takeAction(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.message = `Company ${action} Successfully!`;
        this.toastr.success(this.message);
        this.cdr.detectChanges();
        this.router.navigate(['/company']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.toastr.error(err);
        this.error = 'Failed to perform action!';
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

  goBack() {
    this.router.navigate(['/company']);
  }
}