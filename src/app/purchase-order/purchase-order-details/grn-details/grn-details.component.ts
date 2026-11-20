import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { PdfExportService } from 'app/shared/services/pdf-export.service';

@Component({
  selector: 'app-grn-details',
  templateUrl: './grn-details.component.html',
  styleUrls: ['./grn-details.component.scss'],
  standalone: false,
  animations: [
    trigger('expandCollapse', [
      state('expanded', style({ height: '*', opacity: 1 })),
      state('collapsed', style({ height: '0px', opacity: 0 })),
      transition('expanded <=> collapsed', [
        animate('250ms ease-in-out')
      ])
    ])
  ]
})
export class GrnDetailsComponent implements OnInit {
  @Input() poId!: number;
  form!: FormGroup;
  itemsForm!: FormArray;
  grnId?: number;
  itemsExpanded: boolean = true;
  loading = true;
  isGrnSubmitted = false;

  showRatingModal = false;
  vendorName = '';
  purchaseOrderNo = '';

  stars = Array(5);

  hoverIndex: number | null = null;
  hoverRating: number | null = null;
  selectedRating: number | null = null;
  ratingComment = this.fb.control('');


  savingRating = false;
  poDetails: any;

  constructor(
    private route: ActivatedRoute,
    private purchaseOrderService: PurchaseOrderService,
    private cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private router: Router,
    private pdfExportService: PdfExportService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      grNumber: [{ value: '', disabled: true }],
      purchaseOrderNo: [{ value: '', disabled: true }],
      vendorName: [{ value: '', disabled: true }],
      receiverName: [{ value: '', disabled: true }],
      requestStatus: [{ value: '', disabled: true }],
      remarks: [''],
      items: this.fb.array([])
    });

    this.itemsForm = this.form.get('items') as FormArray;

    this.loadGrnOrPurchaseOrder();
  }

  get itemsControls() {
    return this.itemsForm.controls;
  }

  toggleItems() {
    this.itemsExpanded = !this.itemsExpanded;
  }

  private loadGrnOrPurchaseOrder() {
    this.loading = true;
    this.spinner.show();

    // First try to load GRN
    this.purchaseOrderService.getGoodsReceiptNoteById(this.poId).subscribe({
      next: (grn) => {
        if (grn && grn.id) {
          this.grnId = grn.id;
          this.isGrnSubmitted = true;
          this.poDetails = grn;
          this.patchFormFromGRN(grn);
          this.form.disable({ emitEvent: false });
          this.cdr.detectChanges();
        } else {
          // If no GRN exists, load from PO
          this.purchaseOrderService.getPurchaseOrderById(this.poId).subscribe({
            next: (po) => {
              if (po) this.patchFormFromPO(po);
              this.poDetails = po;
              this.cdr.detectChanges();
            },
            complete: () => this.spinner.hide()
          });
        }
        this.spinner.hide();
      },
      error: () => {
        // fallback to PO if GRN call fails
        this.purchaseOrderService.getPurchaseOrderById(this.poId).subscribe({
          next: (po) => {
            if (po) this.patchFormFromPO(po);
          },
          complete: () => this.spinner.hide()
        });
      }
    });
  }

  private patchFormFromGRN(grn: any) {
    this.form.patchValue({
      grNumber: grn.grNumber,
      purchaseOrderNo: grn.purchaseOrderNo,
      vendorName: grn.vendorName,
      receiverName: grn.receiverName,
      requestStatus: grn.requestStatus,
      remarks: grn.remarks
    });

    this.itemsForm.clear();
    grn.goodsReceiptItems?.forEach((item: any) => {
      this.itemsForm.push(
        this.fb.group({
          purchaseOrderLineId: [item.purchaseOrderLineId],
          itemName: [item.itemName],
          orderedQty: [item.orderedQuantity],
          receivedQuantity: [item.receivedQuantity],
          receivedDate: [item.receivedDate ? item.receivedDate.split('T')[0] : null, Validators.required],
          remarks: [item.remarks]
        })
      );
    });

    this.cdr.detectChanges();
  }

  private patchFormFromPO(po: any) {
    this.form.patchValue({
      purchaseOrderNo: po.purchaseOrderNo,
      vendorName: po.vendorName,
      receiverName: po.receiverName
    });

    this.itemsForm.clear();
    po.items?.forEach((line: any) => {
      this.itemsForm.push(
        this.fb.group({
          purchaseOrderLineId: [line.purchaseOrderLineId],
          itemName: [line.itemName],
          orderedQty: [line.quantity],
          receivedQuantity: [line.shippingQuantity], // prefilled from ShippingQuantity
          receivedDate: [null, Validators.required],
          remarks: ['']
        })
      );
    });

    this.cdr.detectChanges();
  }

  save() {
    if (this.isGrnSubmitted) return;

    if (this.form.invalid) {
      this.toastr.warning('Please fill all required fields.');
      return;
    }

    Swal.fire({
      title: 'Confirm GRN Submission',
      text: 'Are you sure you want to submit this GRN?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, submit',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (!result.isConfirmed) return;

      const itemsPayload = this.itemsForm.controls.map((ctrl) => ({
        purchaseOrderLineId: ctrl.get('purchaseOrderLineId')?.value,
        receivedDate: ctrl.get('receivedDate')?.value
          ? new Date(ctrl.get('receivedDate')?.value)
          : null,
        remarks: ctrl.get('remarks')?.value
      }));

      const grnPayload = {
        remarks: this.form.get('remarks')?.value,
        goodsReceiptItems: itemsPayload
      };

      this.purchaseOrderService.createGoodsReceiptNote({
        purchaseOrderId: this.poId,
        goodsReceiptNote: grnPayload
      }).subscribe({
        next: (res: any) => {
          if (typeof res !== 'number') {
            if (!res?.isSuccess) {
              return;
            }
          }

          this.loadGrnOrPurchaseOrder();
          this.vendorName = this.form.get('vendorName')?.value;
          this.purchaseOrderNo = this.form.get('purchaseOrderNo')?.value;
          this.openRatingModal();
        },
        error: () => this.toastr.error('Failed to create GRN.')
      });
    });
  }

  openRatingModal() {
    this.selectedRating = null;
    this.ratingComment.reset();
    this.hoverRating = null;
    this.hoverIndex = null;    
    this.showRatingModal = true;
  }

  closeRatingModal() {
    this.showRatingModal = false;
    this.cdr.markForCheck();
  }

  hoverStar(event: MouseEvent, index: number) {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    this.hoverIndex = index;
    this.hoverRating = offsetX < rect.width / 2 ? index + 0.5 : index + 1;
  }

  clearHover() {
    this.hoverIndex = null;
    this.hoverRating = null;
  }

  selectRating(index: number) {
    this.selectedRating = this.hoverRating ?? index + 1;
  }

  getStarFill(index: number): 'fa-star' | 'fa-star-half-alt' | 'fa-star-o' {
    const rating = this.hoverRating ?? this.selectedRating ?? 0;
    if (rating >= index + 1) return 'fa-star';
    if (rating >= index + 0.5) return 'fa-star-half-alt';
    return 'fa-star-o';
  }


  submitVendorRating() {
    if (!this.selectedRating) return;

    this.savingRating = true;

    const payload = {
      purchaseOrderId: this.poId,
      vendorRating: {
        rating: this.selectedRating,
        comment: this.ratingComment.value
      }
    };
    this.loading = true;
    this.spinner.show();
    this.purchaseOrderService.addVendorRating(payload)
      .subscribe({
        next: () => {
          this.closeRatingModal();
          this.loading = false;
          this.spinner.hide();
        },
        error: () => {
          this.toastr.error('Failed to submit rating.');
        },
        complete: () => {
          this.savingRating = false;
        }
      });
  }

  downloadGrnPdf(): void {
    if (!this.poId) {
      this.toastr.warning('PO ID not found.');
      return;
    }
    this.spinner.show();
    this.purchaseOrderService.downloadGrnPdf(this.poId).subscribe({
      next: (blob: Blob) => {
        this.spinner.hide();
        const grNo = this.form.get('grNumber')?.value || this.poId;
        this.pdfExportService.downloadBlob(blob, `GRN_${grNo}.pdf`);
      },
      error: () => {
        this.spinner.hide();
        this.fallbackPrintGrn();
      }
    });
  }

  private fallbackPrintGrn(): void {
    const formVal = this.form.value;
    const grNo = formVal.grNumber || `GRN-${this.poId}`;
    const items = this.itemsForm?.controls || [];
    let itemsRows = '';
    items.forEach((control: any, idx: number) => {
      const itm = control.value;
      itemsRows += `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${itm.itemName || '-'}</strong></td>
          <td class="text-end">${itm.orderedQty || 0}</td>
          <td class="text-end">${itm.receivedQuantity || 0}</td>
          <td>${itm.receivedDate || '-'}</td>
          <td>${itm.remarks || '-'}</td>
        </tr>
      `;
    });

    const statusText = formVal.requestStatus || 'Received';
    const statusClass = String(statusText).toLowerCase().includes('receiv') || String(statusText).toLowerCase().includes('approv')
      ? 'status-completed'
      : 'status-approved';

    const html = `
      <div class="header-bar">
        <div>
          <h1>Goods Received Note (GRN)</h1>
          <div class="subtitle">Procurement Portal</div>
        </div>
        <div class="meta-box">
          <div class="doc-number">GRN #: ${grNo}</div>
          <div class="status-badge ${statusClass}">${statusText}</div>
        </div>
      </div>

      <div class="info-cards info-cards-2">
        <div class="info-card">
          <div class="info-card-header">Order & Vendor Reference</div>
          <div class="info-card-body">
            <div class="info-row"><span class="info-label">PO Reference</span><span class="info-value">${formVal.purchaseOrderNo || '-'}</span></div>
            <div class="info-row"><span class="info-label">Vendor Name</span><span class="info-value">${formVal.vendorName || '-'}</span></div>
          </div>
        </div>
        <div class="info-card">
          <div class="info-card-header">Receiving Inspection Details</div>
          <div class="info-card-body">
            <div class="info-row"><span class="info-label">Receiver</span><span class="info-value">${formVal.receiverName || '-'}</span></div>
            <div class="info-row"><span class="info-label">Inspection Note</span><span class="info-value">${formVal.remarks || 'Accepted in good condition'}</span></div>
          </div>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 32px;" class="text-center">#</th>
            <th>Item & Description</th>
            <th style="width: 100px;" class="text-end">Ordered Qty</th>
            <th style="width: 100px;" class="text-end">Received Qty</th>
            <th style="width: 120px;">Receipt Date</th>
            <th>Verification Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows || '<tr><td colspan="6" class="text-center" style="padding: 20px; color: #94a3b8;">No receipt items recorded</td></tr>'}
        </tbody>
      </table>

      <div class="footer-section">
        <div class="signature-block">
          <div class="signature-title">Received & Inspected By</div>
          <div class="signature-line"></div>
          <div class="signature-name">${formVal.receiverName || 'Warehouse Inspector'}</div>
          <div class="signature-role">Quality & Quantity Check</div>
        </div>
        <div class="signature-block">
          <div class="signature-title">Store / Warehouse Incharge</div>
          <div class="signature-line"></div>
          <div class="signature-name">Store Manager</div>
          <div class="signature-role">Inventory Receipt Confirmation</div>
        </div>
      </div>
    `;
    this.pdfExportService.printFormattedDocument(`GRN_${grNo}`, html);
  }
}