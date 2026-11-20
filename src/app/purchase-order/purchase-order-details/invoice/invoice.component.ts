import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PdfExportService } from 'app/shared/services/pdf-export.service';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.scss'],
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
export class InvoiceComponent implements OnInit {
  @Input() poId!: number;
  loading = true;
  invoiceDetails: any = {};
  itemsExpanded: boolean = true;
  constructor(
    private router: Router, 
    private purchaseOrderService: PurchaseOrderService, 
    private pdfExportService: PdfExportService,
    private cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService
  ) { }
    ngOnInit(): void {
    if (this.poId) this.loadInvoiceDetails();
  }

  loadInvoiceDetails() {
    this.loading = true;
    this.spinner.show();
    this.purchaseOrderService.getInvoiceByPoId(this.poId).subscribe({
      next: res => {
        this.invoiceDetails = res;
        this.loading = false;
        this.spinner.hide();
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.spinner.hide();
      }
    });
  }

  downloadInvoice(invoiceId: number, invoiceNo: string) {
    if (!invoiceId) {
      this.fallbackPrintInvoice();
      return;
    }
    this.spinner.show();
    this.purchaseOrderService.downloadInvoicePdf(invoiceId).subscribe({
      next: (blob) => {
        this.spinner.hide();
        this.pdfExportService.downloadBlob(blob, `Invoice_${invoiceNo || invoiceId}.pdf`);
      },
      error: (err) => {
        this.spinner.hide();
        console.warn('API PDF download failed, falling back to formatted print/PDF', err);
        this.fallbackPrintInvoice();
      }
    });
  }

  fallbackPrintInvoice() {
    const inv = this.invoiceDetails || {};
    const items = inv.invoiceItems || [];
    const itemsRows = items.map((it: any, idx: number) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${it.itemName || '-'}</td>
        <td class="text-end">${it.totalQuantity ?? 0}</td>
        <td class="text-end">${Number(it.price || (it.totalQuantity ? it.totalAmount / it.totalQuantity : 0) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="text-end fw-bold">${Number(it.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const totalAmount = items.reduce((sum: number, it: any) => sum + Number(it.totalAmount || 0), 0);
    const invoiceNumber = inv.invoiceNo || `PO-${this.poId}`;
    const statusText = inv.requestStatus || (inv.paymentDate ? 'Paid' : 'Pending Payment');

    const html = `
      <div class="header">
        <div class="company-info">
          <h2>COMMERCIAL INVOICE & PAYMENT RECORD</h2>
          <p>Digital Procurement Portal</p>
        </div>
        <div class="meta-info">
          <div class="doc-number">Invoice #: ${invoiceNumber}</div>
          <div class="status-badge ${inv.paymentDate || String(statusText).toLowerCase().includes('paid') ? 'status-completed' : 'status-approved'}">${statusText}</div>
        </div>
      </div>

      <div class="info-cards info-cards-2">
        <div class="info-card">
          <div class="info-card-header">Invoice & Order Reference</div>
          <div class="info-card-body">
            <div class="info-row"><span class="info-label">PO Reference</span><span class="info-value">${inv.purchaseOrderNo || '-'}</span></div>
            <div class="info-row"><span class="info-label">GRN Reference</span><span class="info-value">${inv.grNumber || '-'}</span></div>
            <div class="info-row"><span class="info-label">Vendor</span><span class="info-value">${inv.vendorName || '-'}</span></div>
            <div class="info-row"><span class="info-label">Invoice Date</span><span class="info-value">${inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-'}</span></div>
            <div class="info-row"><span class="info-label">Due Date</span><span class="info-value">${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</span></div>
          </div>
        </div>
        <div class="info-card">
          <div class="info-card-header">Settlement & Payment Details</div>
          <div class="info-card-body">
            <div class="info-row"><span class="info-label">Payment Terms</span><span class="info-value">${inv.paymentTerms || '-'}</span></div>
            <div class="info-row"><span class="info-label">Payment Method</span><span class="info-value">${inv.paymentMethod || 'Bank Transfer'}</span></div>
            <div class="info-row"><span class="info-label">Payment Date</span><span class="info-value">${inv.paymentDate ? new Date(inv.paymentDate).toLocaleDateString() : (inv.approvalDate ? new Date(inv.approvalDate).toLocaleDateString() : '-')}</span></div>
            <div class="info-row"><span class="info-label">Approval Date</span><span class="info-value">${inv.approvalDate ? new Date(inv.approvalDate).toLocaleDateString() : '-'}</span></div>
            <div class="info-row"><span class="info-label">Remarks</span><span class="info-value">${inv.remarks || '-'}</span></div>
          </div>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 32px;" class="text-center">#</th>
            <th>Item Description</th>
            <th style="width: 70px;" class="text-end">Qty</th>
            <th style="width: 120px;" class="text-end">Unit Price (AED)</th>
            <th style="width: 130px;" class="text-end">Total Amount (AED)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows || '<tr><td colspan="5" class="text-center" style="padding: 20px; color: #94a3b8;">No invoice items found</td></tr>'}
        </tbody>
      </table>

      <div class="totals-section">
        <div class="totals-card">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>AED ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="totals-row">
            <span>Tax / VAT:</span>
            <span>AED 0.00</span>
          </div>
          <div class="totals-row grand-total">
            <span>Total Payable:</span>
            <span>AED ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div class="footer-section">
        <div class="signature-block">
          <div class="signature-title">Prepared By</div>
          <div class="signature-line"></div>
          <div class="signature-name">Finance & Accounts</div>
          <div class="signature-role">Verification of Invoiced Quantities</div>
        </div>
        <div class="signature-block">
          <div class="signature-title">Authorized Approver</div>
          <div class="signature-line"></div>
          <div class="signature-name">Chief Financial Officer</div>
          <div class="signature-role">Disbursement / Settlement Authorization</div>
        </div>
      </div>
    `;

    this.pdfExportService.printFormattedDocument(`Invoice_${invoiceNumber}`, html);
  }

  toggleItems() {
    this.itemsExpanded = !this.itemsExpanded;
  }
}