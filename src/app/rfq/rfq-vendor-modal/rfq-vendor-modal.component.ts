import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { CompanyService } from 'app/shared/services/Company.services';
import { RfqService } from '../rfq.service';

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
    private rfqService: RfqService
  ) { }

  ngOnInit(): void {
    this.quotationRequestId = this.data?.quotationId;
    this.loadRfqVendors(this.quotationRequestId);
  }

  fetchVendorsAndCompaniesForRfq() {
    this.companyService.getVendorsAndCompaniesForRfq().subscribe({
      next: (res: any) => {
        // if backend sends { $id: "1", $values: [ ... ] }
        this.allVendorsandCompanies = res?.$values || [];

      },
      error: (err) => {
        console.error('Error fetching vendors', err);

      }
    });
  }


  loadRfqVendors(quotationRequestId: number): void {
    this.rfqService.getVendorsByQuotationRequestId(quotationRequestId).subscribe({
      next: (res: any) => {
        this.rfqVendors = res?.$values || [];
        this.fetchVendorsAndCompaniesForRfq();
      },

      error: (err) => {
        console.error("Error loading RFQ vendors", err);
        this.rfqVendors = [];
        this.fetchVendorsAndCompaniesForRfq();
      }
    });
  }


  // onSubmit() {
  //   if (!this.quotationRequestId) {
  //     console.error('Quotation Request Id is missing!');
  //     return;
  //   }

  //   // build payload matching QuotationRequestVendorVM
  //   const payload = this.rfqVendors.map(v => ({
  //     quotationRequestId: this.quotationRequestId,
  //     vendorCompanyEntityId: v.id,
  //     vendorId: v.vendorId,       // comes from backend Vendor
  //     vendorCompanyId: v.companyGUID,      // row.id is company GUID in VendorsAndCompaniesVM
  //   }));

  //   this.rfqService.addVendorsToQuotation(payload).subscribe({
  //     next: (res) => {
  //       console.log('Vendors submitted successfully', res);
  //       this.activeModal.close(true);
  //     },
  //     error: (err) => {
  //       console.error('Error submitting vendors', err);
  //     }
  //   });
  // }




  // addVendor(vendor: any) {
  //   const alreadyAdded = this.rfqVendors.some(v => v.vendorCode === vendor.vendorCode);
  //   if (!alreadyAdded) {
  //     this.rfqVendors.push({ ...vendor });
  //   }
  // }

  // addVendor(vendor: any) {
  //   // const alreadyAdded = this.rfqVendors.some(v => v.id === vendor.id);
  //   // if (!alreadyAdded) {
  //   //   this.rfqVendors.push({ ...vendor });
  //   this.rfqVendors = [...this.rfqVendors, vendor];
  // }


  addVendor(vendor: any) {
    if (this.isVendorAdded(vendor.vendorCompanyEntityId)) return;

    // add to rfqVendors for UI display
    this.rfqVendors = [...this.rfqVendors, vendor];

    // also track this one for submission
    this.selectedVendors = [...this.selectedVendors, vendor];
  }

//   addVendor(vendor: any) {
//   const vendorKey = vendor.companyGUID;  // unique per vendor-company
//   if (this.isVendorAdded(vendorKey)) return;

//   this.rfqVendors = [...this.rfqVendors, vendor];
//   this.selectedVendors = [...this.selectedVendors, vendor];
// }


  // onSubmit() {
  //   if (!this.quotationRequestId) {
  //     console.error('Quotation Request Id is missing!');
  //     return;
  //   }

  //   // send only newly selected vendors, not all
  //   const payload = this.selectedVendors.map(v => ({
  //     quotationRequestId: this.quotationRequestId,
  //     vendorCompanyEntityId: v.vendorCompanyEntityId ?? v.id,
  //     vendorId: v.vendorId,
  //     vendorCompanyId: v.companyGUID,
  //   }));

  //   console.log("Submitting only new vendors:", payload);

  //   this.rfqService.addVendorsToQuotation(payload).subscribe({
  //     next: (res) => {
  //       console.log('Vendors submitted successfully', res);

  //       // ✅ reset selectedVendors after successful save
  //       this.selectedVendors = [];
  //       this.activeModal.close(true);
  //     },
  //     error: (err) => {
  //       console.error('Error submitting vendors', err);
  //     }
  //   });
  // }

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
        next: () => console.log("Added vendors successfully"),
        error: (err) => console.error("Error adding vendors", err)
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


  // removeVendor(vendor: any) {
  //   // remove from display list
  //   this.rfqVendors = this.rfqVendors.filter(v => v.id !== vendor.id);

  //   // if vendor already exists in DB, mark for deletion
  //   if (!this.selectedVendors.some(v => v.id === vendor.id)) {
  //     this.removedVendors = [...this.removedVendors, vendor];
  //   } else {
  //     // if it was just newly added in this session, remove from selected list too
  //     this.selectedVendors = this.selectedVendors.filter(v => v.id !== vendor.id);
  //   }
  // }

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




  // removeVendor(vendor: any) {
  //   this.rfqVendors = this.rfqVendors.filter(v => v.vendorCode !== vendor.vendorCode);
  // }

  // removeVendor(vendor: any) {
  //   this.rfqVendors = this.rfqVendors.filter(v => v.id !== vendor.id);
  // }


  printVendor(vendor: any) {
    console.log('Printing Vendor:', vendor);
  }

  emailVendor(vendor: any) {
    console.log('Emailing Vendor:', vendor);
  }

  closeDialog() {
    this.activeModal.close(false);
  }

  isVendorAdded(companyId: number): boolean {
    console.log("sahal", this.rfqVendors.some(v => v.vendorCompanyEntityId === companyId));
    return this.rfqVendors.some(v => v.vendorCompanyEntityId === companyId);

  }




}
