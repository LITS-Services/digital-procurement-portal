import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { CompanyService } from 'app/shared/services/Company.services';
import { RfqService } from '../rfq.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-rfq-vendor-modal',
  templateUrl: './rfq-vendor-modal.component.html',
  styleUrls: ['./rfq-vendor-modal.component.scss']
})
export class RfqVendorModalComponent implements OnInit {
  data!: any;
  // @Input() data: any;
  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('tableRowDetails') tableRowDetails: any;
  @ViewChild('tableResponsive') tableResponsive: any;
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  allVendorsandCompanies = [];
  rfqVendors: any[] = [];
  selectedVendors: any[] = [];
  columns = [];
  removedVendors: any[] = [];
  quotationRequestId: number | null = null;
  constructor(
    public activeModal: NgbActiveModal,
    private companyService: CompanyService,
    private rfqService: RfqService,
    public toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.quotationRequestId = this.data?.quotationId;
    this.loadRfqVendors(this.quotationRequestId);
  }

  // fetchVendorsAndCompaniesForRfq() {
  //   this.rfqService.getVendorsAndCompaniesForRfq().subscribe({
  //     next: (res: any) => {

  //       this.allVendorsandCompanies = res ?? res?.$values ?? [];

  //     },
  //     error: (err) => {
  //       console.error('Error fetching vendors', err);

  //     }
  //   });
  // }
  fetchVendorsAndCompaniesForRfq() {
    const procurementUserId = localStorage.getItem('userId');
    this.rfqService.getVendorsAndCompaniesForRfq(procurementUserId)
      .subscribe({
        next: (res: any) => {
          this.allVendorsandCompanies = res ?? res?.$values ?? [];
        },
        error: (err) => {
          console.error('Error fetching vendors', err);
        }
      });
  }

  loadRfqVendors(quotationRequestId: number): void {
    this.rfqService.getVendorsByQuotationRequestId(quotationRequestId).subscribe({
      next: (res: any) => {
        this.rfqVendors = res || res?.$values || [];
        this.fetchVendorsAndCompaniesForRfq();
      },

      error: (err) => {
        console.error("Error loading RFQ vendors", err);
        this.rfqVendors = [];
        this.fetchVendorsAndCompaniesForRfq();
      }
    });
  }

  // addVendor(vendor: any) {
  //   if (this.isVendorAdded(vendor.vendorCompanyEntityId)) return;

  //   // add to rfqVendors for UI display
  //   this.rfqVendors = [...this.rfqVendors, vendor];

  //   // also track this one for submission
  //   this.selectedVendors = [...this.selectedVendors, vendor];
  // }
  addVendor(vendor: any) {
    const companyId = vendor.vendorCompanyEntityId ?? vendor.id;

    if (this.isVendorAdded(companyId)) return;

    const newVendor = {
      vendorCompanyEntityId: companyId,
      vendorName: vendor.vendorName,
      companyName: vendor.companyName,
      vendorId: vendor.vendorId,
      companyGUID: vendor.companyGUID
    };

    // Add to RFQ vendors list (UI display)
    this.rfqVendors = [...this.rfqVendors, newVendor];

    // Track for submission
    this.selectedVendors = [...this.selectedVendors, newVendor];
  }

  onSubmit() {
    if (!this.quotationRequestId) {
      console.error('Quotation Request Id is missing!');
      return;
    }

    const addPayload = this.selectedVendors.map(v => ({
      quotationRequestId: this.quotationRequestId,
      vendorCompanyEntityId: v.vendorCompanyEntityId ?? v.id,
      vendorId: v.vendorId,
      vendorCompanyId: v.companyGUID,
    }));

    const removePayload = this.removedVendors.map(v => v.vendorCompanyEntityId ?? v.id);

    // First add new vendors
    if (addPayload.length > 0) {
      this.rfqService.addVendorsToQuotation(addPayload).subscribe({
        next: (res) => console.log("Vendors added successfully"),
        error: (err) => this.toastr.error("Error adding vendors")
      });
    }

    // Then remove vendors
    if (removePayload.length > 0) {
      this.rfqService.removeVendorsFromQuotation({
        quotationRequestId: this.quotationRequestId,
        vendorCompanyEntityIds: removePayload
      }).subscribe({
        next: () => console.log("Removed vendors successfully"),
        error: (err) => console.error("Error removing vendors", err)
      });
    }

    this.activeModal.close(true);
  }

  removeVendor(vendor: any) {
    const vendorKey = vendor.vendorCompanyEntityId ?? vendor.id;

    // filter only the clicked vendor
    this.rfqVendors = this.rfqVendors.filter(
      v => (v.vendorCompanyEntityId ?? v.id) !== vendorKey
    );

    // if vendor already exists in DB, mark for deletion
    if (!this.selectedVendors.some(v => (v.vendorCompanyEntityId ?? v.id) === vendorKey)) {
      this.removedVendors = [...this.removedVendors, vendor];
    } else {
      // if it was just newly added in this session, remove from selected list too
      this.selectedVendors = this.selectedVendors.filter(
        v => (v.vendorCompanyEntityId ?? v.id) !== vendorKey
      );
    }
  }

  printVendor(vendor: any) {
    console.log('Printing Vendor:', vendor);
  }

  emailVendor(vendor: any) {
    console.log('Emailing Vendor:', vendor);
  }

  closeDialog() {
    this.activeModal.close(false);
  }

  // isVendorAdded(companyId: number): boolean {
  //   console.log("sahal", this.rfqVendors.some(v => v.vendorCompanyEntityId === companyId));
  //   return this.rfqVendors.some(v => v.vendorCompanyEntityId === companyId);

  // }

  isVendorAdded(companyId: number): boolean {
    return this.rfqVendors.some(
      v => (v.vendorCompanyEntityId ?? v.id) === companyId
    );
  }

}