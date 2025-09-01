import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-rfq-vendor-modal',
  templateUrl: './rfq-vendor-modal.component.html',
  styleUrls: ['./rfq-vendor-modal.component.scss']
})
export class RfqVendorModalComponent implements OnInit {

  @Input() data: any;
  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('tableRowDetails') tableRowDetails: any;
  @ViewChild('tableResponsive') tableResponsive: any;
    public SelectionType = SelectionType;
    public ColumnMode = ColumnMode;
    allVendors = [
      { vendorCode: 'V001', vendorName: 'Alpha Supplies' },
      { vendorCode: 'V002', vendorName: 'Beta Traders' },
      { vendorCode: 'V003', vendorName: 'Gamma Enterprises' },
      { vendorCode: 'V004', vendorName: 'Delta Goods' },
      { vendorCode: 'V005', vendorName: 'Epsilon Imports' },
      { vendorCode: 'V006', vendorName: 'Zeta Tools' },
      { vendorCode: 'V007', vendorName: 'Eta Electronics' },
      { vendorCode: 'V008', vendorName: 'Theta Hardware' },
      { vendorCode: 'V009', vendorName: 'Iota Supplies' },
      { vendorCode: 'V010', vendorName: 'Kappa Distributors' }
    ];
  rfqVendors = [
    { vendorCode: 'V001', vendorName: 'Alpha Supplies' },
      { vendorCode: 'V002', vendorName: 'Beta Traders' },
      { vendorCode: 'V003', vendorName: 'Gamma Enterprises' },
      { vendorCode: 'V004', vendorName: 'Delta Goods' },
      { vendorCode: 'V005', vendorName: 'Epsilon Imports' },
  ];
  columns = [];
  constructor(
    public activeModal: NgbActiveModal
  ) { }

  ngOnInit(): void {
  }
  addVendor(vendor: any) {
    const alreadyAdded = this.rfqVendors.some(v => v.vendorCode === vendor.vendorCode);
    if (!alreadyAdded) {
      this.rfqVendors.push({ ...vendor });
    }
  }

  removeVendor(vendor: any) {
    this.rfqVendors = this.rfqVendors.filter(v => v.vendorCode !== vendor.vendorCode);
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

  isVendorAdded(vendorCode: string): boolean {
    return this.rfqVendors.some(v => v.vendorCode === vendorCode);
  }

}
