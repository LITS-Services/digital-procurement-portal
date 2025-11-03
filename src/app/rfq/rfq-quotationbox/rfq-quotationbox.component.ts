import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
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

  loading = false;

  rfqData: Array<{
    vendorUserId: number;
    vendorName: string;
    amount: number;
    owner: string;
  }> = [];

  selectedVendor: {
    vendorUserId: number;
    vendorName: string;
    amount: number;
    owner: string;
  } | null = null;

  itemsData: any[] = [];
  vendorItemMap: Record<number, { items: any[] }> = {};

  public ColumnMode = ColumnMode; // for items grid
  columns = [];
  newQuotationBoxForm: FormGroup;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private rfqService: RfqService,
    private toastr: ToastrService,
    public cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.newQuotationBoxForm = this.fb.group({
      rfqNo: [''],
      purchaseRequestNo: [''],
      requestStatus: [''],
      owner: [''],
      date: [null],
      title: [''],
      comment: [''],
    });

    if (this.data && this.data.quotationId) {
      this.loadVendors(this.data.quotationId);
    }
  }

  loadVendors(quotationRequestId: number) {
    this.loading = true;
    this.rfqService.getBidSubmissionDetailsByQuotation(quotationRequestId).subscribe({
      next: (res: any) => {
        const vendors = res?.vendors || [];

        // Patch RFQ-level form fields once
        this.newQuotationBoxForm.patchValue({
          rfqNo: res?.rfqNo,
          purchaseRequestNo: res?.purchaseRequestNo,
          owner: res?.owner,
          title: res?.title,
          date: this.toDateInputValue(res?.date),
          requestStatus: res?.requestStatus,
          comment: res?.comment
        });

        // Build left list
        this.rfqData = vendors.map((vendor: any) => ({
          vendorUserId: vendor.vendorUserId,
          vendorName: vendor.vendorName,
          amount: vendor.amount,
          owner: res?.owner
        }));

        // Build vendor → items map
        this.vendorItemMap = {};
        vendors.forEach((vendor: any) => {
          this.vendorItemMap[vendor.vendorUserId] = {
            items: vendor?.bids || []
          };
        });

        // reset selection
        this.selectedVendor = null;
        this.itemsData = [];

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error fetching bid details', err);
        this.loading = false;
      }
    });
  }

  selectVendor(vendor: { vendorUserId: number; vendorName: string; amount: number; owner: string; }) {
    this.selectedVendor = vendor;
    this.itemsData = this.vendorItemMap[vendor.vendorUserId]?.items ?? [];
  }


  /** utilities */
  private toDateInputValue(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  trackVendor = (_: number, v: any) => v.vendorUserId;

    rejectVendor() {
   

    const vendor =  this.selectedVendor

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
 
       ``   },
          error: () => {
          }
        });
      }
    });
  }

  reviseVendor() {

    const vendor = this.selectedVendor

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
            // this.activeModal.close(true);
          },
          error: () => {
          }
        });
      }
    });
  }
}



