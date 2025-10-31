import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { RfqService } from '../rfq.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-rfq-quotationbox',
  templateUrl: './rfq-quotationbox.component.html',
  styleUrls: ['./rfq-quotationbox.component.scss']
})
export class RfqQuotationboxComponent implements OnInit {
  @Input() data: any;

  public chkBoxSelected = [];
  loading = false;
  rfqData = []; // Will fill with dummy data in ngOnInit
  itemsData: any[] = [];     // Selected vendor’s items
  vendorItemMap: any = {};   // Keeps mapping vendor → item list
  isAllSelected: boolean = false;
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  public rows = [];
  columns = [];
  isCreateMode = false;
  newQuotationBoxForm: FormGroup;
  constructor(
    private router: Router,
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private rfqService: RfqService,
    private toastr: ToastrService

  ) { }

  ngOnInit(): void {
    this.newQuotationBoxForm = this.fb.group({
      rfqNo: [''],
      purchaseRequestNo: [''],
      requestStatus: [''],
      owner: [''],
      date: [null],
      title: [''],
      comment: [''],

    })
    if (this.data && this.data.quotationId) {
      this.loadVendors(this.data.quotationId); // load bids for given quotationRequestId
    }

  }

  loadVendors(quotationRequestId: number) {
    this.loading = true;
    this.rfqService.getBidSubmissionDetailsByQuotation(quotationRequestId).subscribe({
      next: (res: any) => {
        // Navigate into res.vendors.$values safely
        const vendors = res?.vendors || [];
        this.newQuotationBoxForm.patchValue({
          quotationRequestId: res?.quotationRequestId,
          rfqNo: res?.rfqNo,
          purchaseRequestNo: res?.purchaseRequestNo,
          owner: res?.owner,
          title: res?.title,
          date: this.toDateInputValue(res?.date),
          requestStatus: res?.requestStatus,
          comment: res?.comment
        })

        // Map only vendor users list
        this.rfqData = vendors.map((vendor: any) => ({
          vendorUserId: vendor.vendorUserId,
          vendorName: vendor.vendorName,
          amount: vendor.amount,
          owner: res?.owner
        }));
        console.log("RFQ DATA: ", this.rfqData);
        // Vendor → Items map (children)
        this.vendorItemMap = {};
        vendors.forEach((vendor: any) => {
          this.vendorItemMap[vendor.vendorUserId] = {
            items: vendor?.bids || []
          };
        });
        this.loading = false;

      },
      error: err => {
        console.error('Error fetching bid details', err);
        this.loading = false;
      }
    });
  }

  private toDateInputValue(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  view() {
    if (this.chkBoxSelected.length !== 1) {
      this.toastr.info('Please select exactly one vendor to view their quotation.');
      return;
    }
    const selectedVendor = this.chkBoxSelected[0];
    this.itemsData = this.vendorItemMap[selectedVendor.vendorUserId].items;
    this.isCreateMode = true;
  }
  backToVendors() {
    this.isCreateMode = false;
    this.chkBoxSelected = [];
    this.itemsData = [];
  }

  closeDialog() {
    this.activeModal.close(false);
  }

  openCreateForm() {
    this.isCreateMode = true;
  }

  submitForm() {
    if (this.newQuotationBoxForm.valid) {
      this.rfqData.push(this.newQuotationBoxForm.value);
      this.isCreateMode = false;
      this.newQuotationBoxForm.reset();
    }
  }
  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = selected;
  }

  onSort(event) {
    this.loading = true;
    setTimeout(() => {
      const rows = [...this.rfqData];
      const sort = event.sorts[0];
      rows.sort((a, b) => {
        return a[sort.prop].localeCompare(b[sort.prop]) * (sort.dir === 'desc' ? -1 : 1);
      });

      this.rfqData = rows;
      this.loading = false;
    }, 1000);
  }

  toggleSelectAll(event) {
    if (event.target.checked) {
      this.chkBoxSelected = [...this.rfqData];
    } else {
      this.chkBoxSelected = [];
    }
  }

  rejectVendor() {
    if (this.chkBoxSelected.length !== 1) {
      this.toastr.info('Please select one vendor to reject.');
      return;
    }

    const vendor = this.chkBoxSelected[0];

    Swal.fire({
      title: 'Reject Vendor?',
      text: 'Are you sure you want to reject this vendor\'s bid?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          quotationRequestId: this.data.quotationId,
          vendorUserId: vendor.vendorUserId,
          action: 'Rejected'
        };

        this.rfqService.rejectOrReviseBid(payload).subscribe({

          next: () => {
            this.activeModal.close(true);
          },
          error: () => {
          }
        });
      }
    });
  }

  reviseVendor() {
    if (this.chkBoxSelected.length !== 1) {
      this.toastr.info('Please select one vendor to revise.');
      return;
    }

    const vendor = this.chkBoxSelected[0];

    Swal.fire({
      title: 'Send for Revision?',
      text: 'Are you sure you want to send this vendor\'s bid for revision?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Revise',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          quotationRequestId: this.data.quotationId,
          vendorUserId: vendor.vendorUserId,
          action: 'Revised'
        };

        this.rfqService.rejectOrReviseBid(payload).subscribe({
          next: () => {
            this.activeModal.close(true);
          },
          error: () => {
          }
        });
      }
    });
  }

}