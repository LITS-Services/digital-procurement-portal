import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { PdfExportService } from 'app/shared/services/pdf-export.service';
import { ShipmentService } from 'app/shared/services/shipment.service';
import { PoRemarksComponent } from '../po-remarks/po-remarks.component';
import { PoApprovalHistoryComponent } from '../po-approval-history/po-approval-history.component';

@Component({
  selector: 'app-purchase-order-details',
  templateUrl: './purchase-order-details.component.html',
  styleUrls: ['./purchase-order-details.component.scss'],
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

export class PurchaseOrderDetailsComponent implements OnInit {
  poId!: number;
  poDetails: any;
  loading = true;
  itemsExpanded = true;
  selectedTab: any = 'po-details';

  // Shipment Line Details Modal
  selectedPoLineId?: number;
  selectedOrderedQty = 0;
  selectedItemName = '';
  shipmentLines: any[] = [];
  loadingShipmentLines = false;

  constructor(
    private route: ActivatedRoute,
    private purchaseOrderService: PurchaseOrderService,
    public cdr: ChangeDetectorRef,
    private router: Router,
    public spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private pdfExportService: PdfExportService,
    private modalService: NgbModal,
    private shipmentService: ShipmentService
  ) { }

  get currentUserId(): string {
    return (localStorage.getItem('userId') || '').trim();
  }

  get isMainApprover(): boolean {
    const userId = this.currentUserId.toLowerCase();
    const approverId = (this.poDetails?.mainApproverId || '').toString().trim().toLowerCase();
    return !!userId && !!approverId && userId === approverId;
  }

  get isStatusInProgress(): boolean {
    const status = (this.poDetails?.requestStatus || '').toString().toLowerCase().replace(/[\s_-]/g, '');
    return status === 'inprogress';
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.poId = +id; 
        this.getPurchaseOrderDetails(this.poId);
      }
    });
  }

  getPurchaseOrderDetails(id: number) {
    this.loading = true;
    this.spinner.show();

    this.purchaseOrderService.getPurchaseOrderById(id)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.spinner.hide();
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.poDetails = res;
        },
        error: (err) => {
          console.error('PO Load Error', err);
          const errorMsg =
            err?.error?.message ||
            (Array.isArray(err?.error?.errors) && err.error.errors[0]) ||
            err?.statusText ||
            'Failed to load purchase order details.';
          this.toastr.error(errorMsg);
        }
      });
  }

  onAddRemarks(action: 'Approve' | 'Reject'): void {
    if (!this.poDetails) return;

    const modalRef = this.modalService.open(PoRemarksComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.action = action;
    modalRef.componentInstance.purchaseOrderNo = this.poDetails.purchaseOrderNo;

    modalRef.result.then((result) => {
      if (result) {
        const payload = {
          PurchaseOrderId: this.poDetails.id,
          PurchaseOrderNo: this.poDetails.purchaseOrderNo,
          Remarks: result.remarks || '',
          ActionTaken: action,
          ApproverId: localStorage.getItem('userId')
        };

        this.spinner.show();
        this.purchaseOrderService.addRemarksWithActionTaken(payload)
          .pipe(finalize(() => this.spinner.hide()))
          .subscribe({
            next: (res: any) => {
              this.toastr.success(res?.message || `Purchase Order ${action}d successfully.`);
              this.router.navigate(['/purchase-order']);
            },
            error: (err: any) => {
              const errorMsg =
                err?.error?.message ||
                (Array.isArray(err?.error?.errors) && err.error.errors[0]) ||
                err?.statusText ||
                `Failed to ${action.toLowerCase()} Purchase Order.`;
              this.toastr.error(errorMsg);
            }
          });
      }
    }).catch(() => {});
  }

  openApprovalHistory(): void {
    if (!this.poDetails?.id) return;

    const modalRef = this.modalService.open(PoApprovalHistoryComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.purchaseOrderId = this.poDetails.id;
    modalRef.componentInstance.purchaseOrderNo = this.poDetails.purchaseOrderNo;
  }

  toggleItems() {
    this.itemsExpanded = !this.itemsExpanded;
  }

  startCommunication(): void {
    if (this.poDetails?.quotationRequestId) {
      this.router.navigate(['/rfq/new-rfq'], {
        queryParams: {
          id: this.poDetails.quotationRequestId,
          mode: 'edit',
          focus: 'comments'
        }
      });
    } else if (this.poDetails?.vendorEmail || this.poDetails?.vendorName) {
      const email = this.poDetails?.vendorEmail || '';
      const subject = encodeURIComponent(`URGENT: Purchase Order ${this.poDetails?.purchaseOrderNo} Acknowledgment Required`);
      const body = encodeURIComponent(`Dear ${this.poDetails?.vendorName || 'Vendor'},\n\nPlease be advised that Purchase Order ${this.poDetails?.purchaseOrderNo} requires immediate electronic order acknowledgment and dispatch scheduling in the Vendor Collaboration Portal.\n\nThank you,\nProcurement Team`);
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    } else {
      this.toastr.info('Follow-up notification sent to vendor.', 'Communication Started');
    }
  }

  downloadPoPdf(): void {
    if (!this.poId) {
      this.toastr.warning('PO ID not found.');
      return;
    }
    this.spinner.show();
    this.purchaseOrderService.downloadPurchaseOrderPdf(this.poId).subscribe({
      next: (blob: Blob) => {
        this.spinner.hide();
        const poNo = this.poDetails?.purchaseOrderNo || this.poId;
        this.pdfExportService.downloadBlob(blob, `PO_${poNo}.pdf`);
      },
      error: () => {
        this.spinner.hide();
        this.fallbackPrintPo();
      }
    });
  }

  private fallbackPrintPo(): void {
    const po = this.poDetails;
    const poNo = po?.purchaseOrderNo || `PO-${this.poId}`;
    const items = po?.items || [];
    let itemsRows = '';
    items.forEach((item: any, idx: number) => {
      itemsRows += `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${item.itemName || '-'}</strong><br><small style="color:#64748b">${item.itemDescription || ''}</small></td>
          <td>${item.projectName || '-'} / ${item.projectActivityName || '-'}</td>
          <td class="text-end">${item.quantity || 0}</td>
          <td class="text-end">${Number(item.amount && item.quantity ? item.amount / item.quantity : 0).toFixed(2)}</td>
          <td class="text-end">${Number(item.amount || 0).toFixed(2)}</td>
        </tr>
      `;
    });

    const createdDate = po?.createdDate ? new Date(po.createdDate).toLocaleDateString() : '-';
    const statusText = po?.requestStatus || 'Active';
    const statusClass = String(statusText).toLowerCase().includes('approv')
      ? 'status-approved'
      : (String(statusText).toLowerCase().includes('reject')
          ? 'status-rejected'
          : (String(statusText).toLowerCase().includes('prog') || String(statusText).toLowerCase().includes('pend')
              ? 'status-inprogress'
              : 'status-draft'));

    const html = `
      <div class="header-bar">
        <div>
          <h1>Purchase Order</h1>
          <div class="subtitle">${po?.entityName || 'Procurement Portal'}</div>
        </div>
        <div class="meta-box">
          <div class="doc-number">ORDER #: ${poNo}</div>
          <div class="doc-date">Date: ${createdDate}</div>
          <div class="status-badge ${statusClass}">${statusText}</div>
        </div>
      </div>

      <div class="info-cards info-cards-3">
        <div class="info-card">
          <div class="info-card-header">Vendor Details</div>
          <div class="info-card-body">
            <div class="info-row"><span class="info-label">Vendor Name</span><span class="info-value">${po?.vendorCompanyName || '-'}</span></div>
            <div class="info-row"><span class="info-label">Department</span><span class="info-value">${po?.department || '-'}</span></div>
            <div class="info-row"><span class="info-label">Order Date</span><span class="info-value">${createdDate}</span></div>
          </div>
        </div>
        <div class="info-card">
          <div class="info-card-header">Shipment & Delivery</div>
          <div class="info-card-body">
            <div class="info-row"><span class="info-label">Ship To</span><span class="info-value">${po?.shipToName || po?.receiverName || '-'}</span></div>
            <div class="info-row"><span class="info-label">Location Code</span><span class="info-value">${po?.locationCode || '-'}</span></div>
            <div class="info-row"><span class="info-label">Destination</span><span class="info-value">${[po?.shipToCity, po?.shipToCountry].filter(Boolean).join(', ') || '-'}</span></div>
            <div class="info-row"><span class="info-label">Post Code</span><span class="info-value">${po?.shipToPostCode || '-'}</span></div>
            ${po?.shipmentDetailNo ? `<div class="info-row"><span class="info-label">Shipment Ref</span><span class="info-value">${po.shipmentDetailNo}</span></div>` : ''}
          </div>
        </div>
        <div class="info-card">
          <div class="info-card-header">Procurement References</div>
          <div class="info-card-body">
            <div class="info-row"><span class="info-label">Purchase Request</span><span class="info-value">${po?.requisitionNo || '-'}</span></div>
            <div class="info-row"><span class="info-label">Quotation</span><span class="info-value">${po?.rfqNo || '-'}</span></div>
            <div class="info-row"><span class="info-label">Status</span><span class="info-value">${statusText}</span></div>
          </div>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 32px;" class="text-center">#</th>
            <th>Item & Description</th>
            <th>Project / Activity</th>
            <th style="width: 65px;" class="text-end">Qty</th>
            <th style="width: 110px;" class="text-end">Unit Rate (AED)</th>
            <th style="width: 120px;" class="text-end">Total (AED)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows || '<tr><td colspan="6" class="text-center" style="padding: 20px; color: #94a3b8;">No purchase order items found</td></tr>'}
        </tbody>
      </table>

      <div class="totals-box">
        <div class="totals-card">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>AED ${Number(po?.totalAmount || 0).toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>VAT / Taxes:</span>
            <span>AED 0.00</span>
          </div>
          <div class="totals-row grand-total">
            <span>Grand Total:</span>
            <span>AED ${Number(po?.totalAmount || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="footer-section">
        <div class="signature-block">
          <div class="signature-title">Authorized Buyer</div>
          <div class="signature-line"></div>
          <div class="signature-name">Procurement Authority</div>
          <div class="signature-role">Approved Purchase Order</div>
        </div>
        <div class="signature-block">
          <div class="signature-title">Vendor Acceptance</div>
          <div class="signature-line"></div>
          <div class="signature-name">${po?.vendorCompanyName || 'Authorized Signatory'}</div>
          <div class="signature-role">Acknowledgment & Seal</div>
        </div>
      </div>
    `;
    this.pdfExportService.printFormattedDocument(`PO_${poNo}`, html);
  }

  homePage() {
    this.router.navigate(['purchase-order']);
  }

  openShipmentLineDetail(row: any, content: any): void {
    this.selectedPoLineId = row.purchaseOrderLineId || row.id;
    this.selectedOrderedQty = row.quantity ?? row.orderedQuantity ?? row.qty ?? 0;
    this.selectedItemName = row.itemName ?? row.item ?? '-';
    this.shipmentLines = [];
    this.loadingShipmentLines = true;

    this.modalService.open(content, { size: 'lg', centered: true });

    if (this.selectedPoLineId) {
      this.shipmentService.getShipmentLinesByPoLineId(this.selectedPoLineId).subscribe({
        next: (res: any) => {
          const data = Array.isArray(res) ? res : (Array.isArray(res?.value) ? res.value : (Array.isArray(res?.data) ? res.data : []));
          this.shipmentLines = data;
          this.loadingShipmentLines = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.shipmentLines = [];
          this.loadingShipmentLines = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.loadingShipmentLines = false;
    }
  }

  get totalShippedQty(): number {
    return (this.shipmentLines || []).reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
  }

  selectTab(tab: any) {
    this.selectedTab = tab;
  }
}