import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-vendor-comparision',
  templateUrl: './vendor-comparision.component.html',
  styleUrls: ['./vendor-comparision.component.scss']
})
export class VendorComparisionComponent implements OnInit {

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
    {
      vendorID: 'V001',
      vendorName: 'Vendor Alpha',
      description: 'Office Supplies',
      Amount: 1200
    },
    {
      vendorID: 'V002',
      vendorName: 'Vendor Beta',
      description: 'IT Equipment',
      Amount: 4500
    },
    {
      vendorID: 'V003',
      vendorName: 'Vendor Gamma',
      description: 'Furniture',
      Amount: 3200
    }
  ];


  columns = [];
  constructor(
    public activeModal: NgbActiveModal
  ) {
    
   }


  ngOnInit(): void {
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
  toggleExpandRow(row: any) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  onActivate(event: any) {
    // Optional: for click/debug events
  }
}
