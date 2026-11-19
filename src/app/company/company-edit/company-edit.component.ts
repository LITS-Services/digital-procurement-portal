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

  paymentMethod: string = '';
  paymentTerm: string = '';
  vendorPostingGroup: string = '';
  vatBusinessPostingGroup: string = '';
  generalBusinessPostingGroup: string = '';

  // Pending updates & Diff tracking
  pendingUpdate: any = null;
  updateHistory: any[] = [];
  diffFilterSection: string = 'All';
  diffViewMode: 'cards' | 'table' = 'cards';

  companyLogoUrl: string | null = null;
  companyWebsite: string | null = null;
  trnNumber: string = '';
  procurementOfficer: any = null;
  financeOfficer: any = null;
  procurementOfficers: any[] = [];
  financeOfficers: any[] = [];

  // Section A: Background Information
  postalAddress: string = '';
  organizationType: string = '';
  geographicalAreaOfOperations: string = '';
  companyRegistrationNo: string = '';
  dateOfRegistration: string = '';
  durationOfBusinessOperations: string = '';
  descriptionOfGoodsServices: string = '';
  descriptionOfGoods: string = '';
  descriptionOfServices: string = '';
  descriptionOfWorks: string = '';
  totalWorkForce: string = '';

  // Section C: References & Credit Period
  clienteleList: any[] = [];
  refereeList: any[] = [];
  hasCreditPeriod30Days: boolean | null = null;
  creditPeriod: string = '';

  // Section D: Technical Competence
  proofOfProfessionalism: string = '';
  keyPersonnelQualifications: string = '';

  // Section E: Management Policies
  hasEmploymentPolicy: boolean | null = null;
  employeeScreeningExplanation: string = '';
  hasCodeOfConduct: boolean | null = null;
  codeOfConductDetails: string = '';
  employeeIntegrityMeasures: string = '';
  hasEmployeeTrainingProgram: boolean | null = null;

  splitGeographicalAreas(areasStr?: string): string[] {
    if (!areasStr) return [];
    return areasStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  parseGoodsServicesWorks(raw: string) {
    if (!raw) {
      this.descriptionOfGoods = '';
      this.descriptionOfServices = '';
      this.descriptionOfWorks = '';
      return;
    }
    const goodsMatch = raw.match(/Goods:\s*([\s\S]*?)(?=(?:Services:|Works:|$))/i);
    const servicesMatch = raw.match(/Services:\s*([\s\S]*?)(?=(?:Goods:|Works:|$))/i);
    const worksMatch = raw.match(/Works:\s*([\s\S]*?)(?=(?:Goods:|Services:|$))/i);

    if (goodsMatch || servicesMatch || worksMatch) {
      this.descriptionOfGoods = goodsMatch ? goodsMatch[1].trim() : '';
      this.descriptionOfServices = servicesMatch ? servicesMatch[1].trim() : '';
      this.descriptionOfWorks = worksMatch ? worksMatch[1].trim() : '';
    } else {
      this.descriptionOfGoods = raw;
      this.descriptionOfServices = '';
      this.descriptionOfWorks = '';
    }
  }

  getInitials(name?: string): string {
    if (!name) return 'OF';
    const baseName = name.replace(/_[A-Za-z0-9]+$/, '').trim();
    const words = baseName.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[.\s_-]+/).filter(w => w.length > 0);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    if (words.length === 1 && words[0].length >= 2) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (name.substring(0, 2) || 'OF').toUpperCase();
  }
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

          // Handle potential wrappers from API (e.g. value, result, data)
          const company = res?.value?.vendorCompany || res?.value || res?.result?.vendorCompany || res?.result || res?.vendorCompany || res?.data || res;
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
          this.trnNumber = company.trnNumber || company.trn || '';

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
          this.paymentMethod = company.paymentMethod || '';
          this.paymentTerm = company.paymentTerm || '';
          this.vendorPostingGroup = company.vendorPostingGroup || '';
          this.vatBusinessPostingGroup = company.vatBusinessPostingGroup || '';
          this.generalBusinessPostingGroup = company.generalBusinessPostingGroup || '';

          // Section A: Background Information
          this.postalAddress = company.postalAddress || '';
          this.organizationType = company.organizationType || '';
          this.geographicalAreaOfOperations = company.geographicalAreaOfOperations || '';
          this.companyRegistrationNo = company.companyRegistrationNo || '';
          this.dateOfRegistration = company.dateOfRegistration ? company.dateOfRegistration.substring(0, 10) : '';
          this.durationOfBusinessOperations = company.durationOfBusinessOperations || '';
          this.descriptionOfGoodsServices = company.descriptionOfGoodsServices || '';
          this.descriptionOfGoods = company.descriptionOfGoods || '';
          this.descriptionOfServices = company.descriptionOfServices || '';
          this.descriptionOfWorks = company.descriptionOfWorks || '';
          if (!this.descriptionOfGoods && !this.descriptionOfServices && !this.descriptionOfWorks && this.descriptionOfGoodsServices) {
            this.parseGoodsServicesWorks(this.descriptionOfGoodsServices);
          }
          this.totalWorkForce = company.totalWorkForce || '';

          // Section C: References & Credit Period
          this.hasCreditPeriod30Days = company.hasCreditPeriod30Days !== undefined ? company.hasCreditPeriod30Days : null;
          this.creditPeriod = company.creditPeriod || '';
          const rawClientele = company.clientele?.$values || company.clientele || [];
          this.clienteleList = rawClientele.map((c: any) => ({
            id: c.id,
            clientName: c.clientName || '',
            supplies: c.supplies || '',
            duration: c.duration || '',
            totalContractValue: c.totalContractValue || ''
          }));
          const rawReferees = company.referees?.$values || company.referees || [];
          this.refereeList = rawReferees.map((r: any) => ({
            id: r.id,
            organization: r.organization || '',
            contactName: r.contactName || '',
            position: r.position || '',
            telephoneNo: r.telephoneNo || '',
            emailAddress: r.emailAddress || '',
            hasOfficialStamp: r.hasOfficialStamp || false,
            hasSignature: r.hasSignature || false,
            lpoAttachmentUrl: r.lpoAttachmentUrl || ''
          }));

          // Section D: Technical Competence
          this.proofOfProfessionalism = company.proofOfProfessionalism || '';
          this.keyPersonnelQualifications = company.keyPersonnelQualifications || '';

          // Section E: Management Policies
          this.hasEmploymentPolicy = company.hasEmploymentPolicy !== undefined ? company.hasEmploymentPolicy : null;
          this.employeeScreeningExplanation = company.employeeScreeningExplanation || '';
          this.hasCodeOfConduct = company.hasCodeOfConduct !== undefined ? company.hasCodeOfConduct : null;
          this.codeOfConductDetails = company.codeOfConductDetails || '';
          this.employeeIntegrityMeasures = company.employeeIntegrityMeasures || '';
          this.hasEmployeeTrainingProgram = company.hasEmployeeTrainingProgram !== undefined ? company.hasEmployeeTrainingProgram : null;

          this.pendingUpdate = company.pendingUpdate || null;
          this.updateHistory = company.updateHistory || [];
          console.log('Pending update info:', this.pendingUpdate);

          // Normalize Procurement Officers
          const rawProcOfficers = company.procurementOfficers?.$values || company.procurementOfficers;
          if (Array.isArray(rawProcOfficers) && rawProcOfficers.length > 0) {
            this.procurementOfficers = rawProcOfficers.map((o: any) => ({
              fullName: o.fullName || o.FullName || o.userName || o.UserName || '',
              email: o.email || o.Email || '',
              phoneNumber: o.phoneNumber || o.PhoneNumber || o.phoneNo || o.PhoneNo || '',
              type: o.type || o.Type || 'Procurement Officer'
            }));
          } else if (company.procurementOfficer) {
            const o = company.procurementOfficer;
            this.procurementOfficers = [{
              fullName: o.fullName || o.FullName || o.userName || o.UserName || '',
              email: o.email || o.Email || '',
              phoneNumber: o.phoneNumber || o.PhoneNumber || o.phoneNo || o.PhoneNo || '',
              type: o.type || o.Type || 'Procurement Officer'
            }];
          } else {
            this.procurementOfficers = [];
          }
          this.procurementOfficer = this.procurementOfficers[0] || null;

          // Normalize Finance Officers
          const rawFinOfficers = company.financeOfficers?.$values || company.financeOfficers;
          if (Array.isArray(rawFinOfficers) && rawFinOfficers.length > 0) {
            this.financeOfficers = rawFinOfficers.map((o: any) => ({
              fullName: o.fullName || o.FullName || o.userName || o.UserName || '',
              email: o.email || o.Email || '',
              phoneNumber: o.phoneNumber || o.PhoneNumber || o.phoneNo || o.PhoneNo || '',
              type: o.type || o.Type || 'Finance Officer'
            }));
          } else if (company.financeOfficer) {
            const o = company.financeOfficer;
            this.financeOfficers = [{
              fullName: o.fullName || o.FullName || o.userName || o.UserName || '',
              email: o.email || o.Email || '',
              phoneNumber: o.phoneNumber || o.PhoneNumber || o.phoneNo || o.PhoneNo || '',
              type: o.type || o.Type || 'Finance Officer'
            }];
          } else {
            this.financeOfficers = [];
          }
          this.financeOfficer = this.financeOfficers[0] || null;

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
            town: a.town || '',
            building: a.building || '',
            floor: a.floor || '',
            postalAddress: a.postalAddress || '',
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
            contactRole: c.contactRole || '',
            contactPerson: c.contactPerson || '',
            designation: c.designation || '',
            email: c.email || '',
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
            documentType: f.documentType || '',
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
            ? 'Sourcing Company submitted for approval successfully.'
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

  get totalPendingChangesCount(): number {
    return this.pendingUpdate?.changes?.length || 0;
  }

  get modifiedChangesCount(): number {
    if (!this.pendingUpdate?.changes) return 0;
    return this.pendingUpdate.changes.filter((c: any) => (c.changeType || '').toLowerCase() === 'modified').length;
  }

  get addedChangesCount(): number {
    if (!this.pendingUpdate?.changes) return 0;
    return this.pendingUpdate.changes.filter((c: any) => (c.changeType || '').toLowerCase() === 'added').length;
  }

  get removedChangesCount(): number {
    if (!this.pendingUpdate?.changes) return 0;
    return this.pendingUpdate.changes.filter((c: any) => (c.changeType || '').toLowerCase() === 'removed').length;
  }

  getChangesForSection(sectionName: string): any[] {
    if (!this.pendingUpdate?.changes) return [];
    return this.pendingUpdate.changes.filter((c: any) => c.section === sectionName);
  }

  getSectionChangeCount(sectionKey: string): number {
    if (!this.pendingUpdate?.sectionChangeCounts) return 0;
    return this.pendingUpdate.sectionChangeCounts[sectionKey] || 0;
  }

  getSectionCountByName(sectionName: string): number {
    if (!this.pendingUpdate?.changes) return 0;
    return this.pendingUpdate.changes.filter((c: any) => c.section === sectionName).length;
  }

  getSectionChanges(sectionKey: string): any[] {
    if (!this.pendingUpdate?.changes) return [];
    return this.pendingUpdate.changes.filter((c: any) => c.sectionKey === sectionKey);
  }

  getFieldChange(sectionKey: string, fieldKey: string, itemIndex?: number): any {
    if (!this.pendingUpdate?.changes) return null;
    return this.pendingUpdate.changes.find((c: any) =>
      c.sectionKey === sectionKey &&
      c.fieldKey?.toLowerCase() === fieldKey?.toLowerCase() &&
      (itemIndex === undefined || c.itemIndex === itemIndex || c.itemIndex === null || c.itemIndex === undefined)
    );
  }

  isFieldChanged(sectionKey: string, fieldKey: string, itemIndex?: number): boolean {
    return !!this.getFieldChange(sectionKey, fieldKey, itemIndex);
  }

  getBankItemChanges(index: number): any[] {
    if (!this.pendingUpdate?.changes) return [];
    return this.pendingUpdate.changes.filter((c: any) =>
      c.sectionKey === 'bank-details' && (c.itemIndex === index || (c.itemIndex === undefined && this.bankDetailsList.length === 1))
    );
  }

  isBankItemChanged(index: number): boolean {
    return this.getBankItemChanges(index).length > 0;
  }

  getBankItemChangeType(index: number): string {
    const changes = this.getBankItemChanges(index);
    if (!changes.length) return '';
    const addChange = changes.find((c: any) => c.changeType === 'Added');
    if (addChange) return 'Added';
    const remChange = changes.find((c: any) => c.changeType === 'Removed');
    if (remChange) return 'Removed';
    return 'Modified';
  }

  navigateToSection(sectionName: string): void {
    const map: { [key: string]: string } = {
      'General Information': 'general-info',
      'Bank Details': 'bank-details',
      'Addresses': 'addresses',
      'Contact Details': 'company-contacts',
      'Demographics': 'purchasing-demo',
      'Attachments': 'attachments'
    };
    const tabKey = map[sectionName] || 'general-info';
    this.selectTab(tabKey);
  }

  get filteredDiffChanges(): any[] {
    if (!this.pendingUpdate?.changes) return [];
    if (this.diffFilterSection === 'All') return this.pendingUpdate.changes;
    return this.pendingUpdate.changes.filter((c: any) => c.section === this.diffFilterSection || c.sectionKey === this.diffFilterSection);
  }

  get uniqueSectionsWithChanges(): string[] {
    if (!this.pendingUpdate?.changes) return [];
    const set = new Set<string>();
    this.pendingUpdate.changes.forEach((c: any) => {
      if (c.section) set.add(c.section);
    });
    return Array.from(set);
  }

  selectedDiffSection: string = '';
  diffSearchQuery: string = '';
  reviewedSections: Set<string> = new Set<string>();

  get currentDiffSection(): string {
    if (this.selectedDiffSection) return this.selectedDiffSection;
    if (this.uniqueSectionsWithChanges.length > 0) {
      const first = this.uniqueSectionsWithChanges[0];
      this.reviewedSections.add(first);
      return first;
    }
    return 'Audit Log';
  }

  selectDiffSection(sec: string): void {
    this.selectedDiffSection = sec;
    this.diffSearchQuery = '';
    if (sec && sec !== 'All' && sec !== 'Audit Log') {
      this.reviewedSections.add(sec);
    }
  }

  get reviewedSectionCount(): number {
    return this.reviewedSections.size;
  }

  get reviewProgressPercent(): number {
    const total = this.uniqueSectionsWithChanges.length;
    if (total === 0) return 100;
    return Math.min(100, Math.round((this.reviewedSections.size / total) * 100));
  }

  get activeSectionChanges(): any[] {
    if (this.currentDiffSection === 'All') {
      return this.pendingUpdate?.changes || [];
    }
    if (this.currentDiffSection === 'Audit Log') {
      return [];
    }
    return this.getChangesForSection(this.currentDiffSection);
  }

  get filteredActiveSectionChanges(): any[] {
    const changes = this.activeSectionChanges;
    if (!this.diffSearchQuery || !this.diffSearchQuery.trim()) {
      return changes;
    }
    const q = this.diffSearchQuery.toLowerCase().trim();
    return changes.filter((c: any) =>
      (c.field && c.field.toLowerCase().includes(q)) ||
      (c.oldValue && c.oldValue.toLowerCase().includes(q)) ||
      (c.newValue && c.newValue.toLowerCase().includes(q)) ||
      (c.section && c.section.toLowerCase().includes(q)) ||
      (c.itemIdentifier && c.itemIdentifier.toLowerCase().includes(q))
    );
  }

  copyToClipboard(val: string, label: string): void {
    if (!val) return;
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(val).then(() => {
        this.toastr.success(`Copied ${label || 'value'} to clipboard`);
      }).catch(() => {
        this.toastr.info(`Value: ${val}`);
      });
    } else {
      this.toastr.info(`Value: ${val}`);
    }
  }

  get currentSectionIndex(): number {
    return this.uniqueSectionsWithChanges.indexOf(this.currentDiffSection);
  }

  get hasPreviousSection(): boolean {
    return this.currentSectionIndex > 0;
  }

  get hasNextSection(): boolean {
    return this.currentSectionIndex >= 0 && this.currentSectionIndex < this.uniqueSectionsWithChanges.length - 1;
  }

  goToPreviousSection(): void {
    if (this.hasPreviousSection) {
      this.selectDiffSection(this.uniqueSectionsWithChanges[this.currentSectionIndex - 1]);
    }
  }

  goToNextSection(): void {
    if (this.hasNextSection) {
      this.selectDiffSection(this.uniqueSectionsWithChanges[this.currentSectionIndex + 1]);
    } else if (this.updateHistory?.length > 0) {
      this.selectDiffSection('Audit Log');
    }
  }

  getChangeTypeBadgeClass(changeType: string): string {
    switch ((changeType || '').toLowerCase()) {
      case 'added': return 'badge-diff-added';
      case 'removed': return 'badge-diff-removed';
      case 'modified': return 'badge-diff-modified';
      default: return 'badge-diff-default';
    }
  }

  getSectionFeatherIcon(section: string): string {
    switch ((section || '').toLowerCase()) {
      case 'general information': return 'ft-briefcase';
      case 'bank details': return 'ft-credit-card';
      case 'addresses': return 'ft-map-pin';
      case 'contact details': return 'ft-phone';
      case 'demographics': return 'ft-pie-chart';
      case 'attachments': return 'ft-paperclip';
      default: return 'ft-file-text';
    }
  }

  getChangeStatusClass(changeType: string): string {
    switch ((changeType || '').toLowerCase()) {
      case 'added': return 'status-onboarded';
      case 'removed': return 'diff-status-removed';
      case 'modified': return 'status-in-process';
      default: return 'status-default';
    }
  }

  getAuditStatusClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'approved': return 'status-onboarded';
      case 'rejected': return 'diff-status-removed';
      case 'sendback': return 'status-in-process';
      case 'pending': return 'status-pending';
      default: return 'status-default';
    }
  }

  getSectionIcon(section: string): string {
    switch ((section || '').toLowerCase()) {
      case 'bank details': return 'fa fa-university text-warning';
      case 'general information': return 'fa fa-building text-primary';
      case 'addresses': return 'fa fa-map-marker text-danger';
      case 'contact details': return 'fa fa-phone text-info';
      case 'demographics': return 'fa fa-chart-pie text-success';
      case 'attachments': return 'fa fa-paperclip text-secondary';
      default: return 'fa fa-edit text-dark';
    }
  }

  goBack() {
    this.router.navigate(['/company']);
  }
}