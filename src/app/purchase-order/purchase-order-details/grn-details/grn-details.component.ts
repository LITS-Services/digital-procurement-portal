import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataSourceService } from 'app/shared/services/data-source.service';
import { LookupService } from 'app/shared/services/lookup.service';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';
import { DatatableComponent } from '@swimlane/ngx-datatable';
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
export class GrnDetailsComponent implements OnInit, OnChanges {
  private _poId!: number;

  @Input()
  set poId(val: number) {
    this._poId = val;
    if (this._poId) {
      this.loadGrnList();
      this.loadPurchaseOrderDetails();
    }
  }
  get poId(): number {
    return this._poId;
  }

  @ViewChild('datatable', { static: false }) datatable!: DatatableComponent;

  viewMode: 'list' | 'add' | 'detail' = 'list';
  grnList: any[] = [];
  selectedGrn: any = null;
  poDetails: any = null;

  showFilterBar = false;
  pageSize = 10;
  totalItems = 0;

  get isMobile(): boolean {
    return window.innerWidth <= 1400;
  }

  toggleFilterBar() {
    this.showFilterBar = !this.showFilterBar;
  }

  defaultPaymentMethods = [
    { stringId: 'BANK', code: 'BANK', description: 'BANK - Bank Transfer' },
    { stringId: 'CARD', code: 'CARD', description: 'CARD - Card payment' },
    { stringId: 'CASH', code: 'CASH', description: 'CASH - Cash payment' },
    { stringId: 'CHECK', code: 'CHECK', description: 'CHECK - Check payment' },
    { stringId: 'PAYPAL', code: 'PAYPAL', description: 'PAYPAL - PayPal payment' },
    { stringId: 'ACCOUNT', code: 'ACCOUNT', description: 'ACCOUNT - Payment on account' },
    { stringId: 'BNKCONVDOM', code: 'BNKCONVDOM', description: 'BNKCONVDOM - Bank Data Conversion Domestic' },
    { stringId: 'BNKCONVINT', code: 'BNKCONVINT', description: 'BNKCONVINT - Bank Data Conversion International' }
  ];

  defaultPaymentTerms = [
    { stringId: '30 DAYS', code: '30 DAYS', description: '30 DAYS - Net 30 days' },
    { stringId: '60 DAYS', code: '60 DAYS', description: '60 DAYS - Net 60 days' },
    { stringId: '90 DAYS', code: '90 DAYS', description: '90 DAYS - Net 90 days' },
    { stringId: '120 DAYS', code: '120 DAYS', description: '120 DAYS - Net 120 days' },
    { stringId: '10 DAYS', code: '10 DAYS', description: '10 DAYS - Net 10 days' },
    { stringId: '14 DAYS', code: '14 DAYS', description: '14 DAYS - Net 14 days' },
    { stringId: '15 DAYS', code: '15 DAYS', description: '15 DAYS - Net 15 days' },
    { stringId: '21 DAYS', code: '21 DAYS', description: '21 DAYS - Net 21 days' },
    { stringId: '2 DAYS', code: '2 DAYS', description: '2 DAYS - Net 2 days' },
    { stringId: '1M(8D)', code: '1M(8D)', description: '1M(8D) - 1 Month/2% 8 days' }
  ];

  paymentMethods: any[] = [...this.defaultPaymentMethods];
  paymentTerms: any[] = [...this.defaultPaymentTerms];

  form!: FormGroup;
  itemsForm!: FormArray;
  itemsExpanded: boolean = true;
  loading = false;
  saving = false;

  // Rating Modal
  showRatingModal = false;
  vendorName = '';
  purchaseOrderNo = '';
  stars = Array(5);
  hoverIndex: number | null = null;
  hoverRating: number | null = null;
  selectedRating: number | null = null;
  ratingComment = this.fb.control('');
  savingRating = false;

  constructor(
    private route: ActivatedRoute,
    private purchaseOrderService: PurchaseOrderService,
    private lookupService: LookupService,
    private dataSourceService: DataSourceService,
    private cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private router: Router,
    private pdfExportService: PdfExportService
  ) {}

  get isLocalMode(): boolean {
    return this.dataSourceService.mode === 'local';
  }

  get itemsControls() {
    return this.itemsForm ? this.itemsForm.controls : [];
  }

  ngOnInit(): void {
    this.dataSourceService.load().subscribe();
    this.initForm();
    this.loadLookups();
    if (this.poId) {
      this.loadGrnList();
      this.loadPurchaseOrderDetails();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['poId'] && changes['poId'].currentValue) {
      this.loadGrnList();
      this.loadPurchaseOrderDetails();
    }
  }

  initForm() {
    this.form = this.fb.group({
      grNumber: [{ value: 'Auto Generated', disabled: true }],
      purchaseOrderNo: [{ value: '', disabled: true }],
      vendorNo: [{ value: '', disabled: true }],
      vendorName: [{ value: '', disabled: true }],
      receiverName: [''],
      orderDate: [''],
      postingDate: [this.getTodayDateString(), Validators.required],
      documentDate: [this.getTodayDateString(), Validators.required],
      dueDate: [''],
      vendorCurrency: ['SAR'],
      paymentMethod: [''],
      paymentTerms: [''],
      locationCode: [''],
      address: [''],
      address2: [''],
      city: [''],
      shipToName: [''],
      shipToAddress: [''],
      shipToAddress2: [''],
      shipToCity: [''],
      shipToPostCode: [''],
      shipToCountry: [''],
      payToAddress: [''],
      remarks: [''],
      items: this.fb.array([])
    });

    this.itemsForm = this.form.get('items') as FormArray;
  }

  getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  formatDate(date: any): string {
    if (!date) return '';
    try {
      return new Date(date).toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  mapStatusKey(status: string): string {
    const s = (status || '').toLowerCase().trim();
    if (['approved', 'open', 'delivered', 'completed', 'active'].includes(s)) {
      return 'chip--approved';
    }
    if (['inprogress', 'in progress', 'pending', 'new', 'submitted'].includes(s)) {
      return 'chip--pending';
    }
    if (['rejected', 'cancelled', 'canceled'].includes(s)) {
      return 'chip--rejected';
    }
    return 'chip--draft';
  }

  loadLookups() {
    this.lookupService.getPaymentMethods().subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.paymentMethods = res;
        }
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    this.lookupService.getPaymentTerms().subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.paymentTerms = res;
        }
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadGrnList() {
    if (!this.poId) return;
    this.loading = true;
    this.spinner.show();
    this.purchaseOrderService.getAllGoodsReceiptNotes(this.poId, 1, 100).subscribe({
      next: (res: any) => {
        let list: any[] = [];
        if (Array.isArray(res)) {
          list = res;
        } else if (res?.result && Array.isArray(res.result)) {
          list = res.result;
        } else if (res?.value?.result && Array.isArray(res.value.result)) {
          list = res.value.result;
        } else if (res?.items && Array.isArray(res.items)) {
          list = res.items;
        } else if (Array.isArray(res?.value)) {
          list = res.value;
        }
        this.grnList = list;
        this.totalItems = list.length;
        this.loading = false;
        this.spinner.hide();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load GRN list:', err);
        this.grnList = [];
        this.loading = false;
        this.spinner.hide();
        this.cdr.detectChanges();
      }
    });
  }

  loadPurchaseOrderDetails() {
    if (!this.poId) return;
    this.purchaseOrderService.getPurchaseOrderById(this.poId).subscribe({
      next: (po: any) => {
        this.poDetails = po;
        this.vendorName = po.vendorName || po.vendorCompanyName || '';
        this.purchaseOrderNo = po.purchaseOrderNo || '';
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  openAddGrn() {
    if (!this.isLocalMode) {
      this.toastr.warning('Adding GRN is only allowed in local data source mode.');
      return;
    }

    if (!this.poDetails) {
      this.purchaseOrderService.getPurchaseOrderById(this.poId).subscribe({
        next: (po: any) => {
          this.poDetails = po;
          this.prepareAddForm();
        }
      });
    } else {
      this.prepareAddForm();
    }
  }

  private prepareAddForm() {
    const po = this.poDetails;
    this.form.reset();

    this.form.patchValue({
      grNumber: 'Auto Generated',
      purchaseOrderNo: po.purchaseOrderNo || '',
      vendorNo: po.vendorNo || '',
      vendorName: po.vendorName || po.vendorCompanyName || '',
      receiverName: po.receiverName || '',
      orderDate: this.formatDate(po.orderDate || po.createdDate),
      postingDate: this.getTodayDateString(),
      documentDate: this.getTodayDateString(),
      dueDate: this.formatDate(po.dueDate),
      vendorCurrency: po.vendorCurrency || 'SAR',
      paymentMethod: po.paymentMethod || '',
      paymentTerms: po.paymentTerms || '',
      locationCode: po.locationCode || '',
      address: po.address || '',
      address2: po.address2 || '',
      city: po.city || '',
      shipToName: po.shipToName || po.receiverName || '',
      shipToAddress: po.shipToAddress || po.address || '',
      shipToAddress2: po.shipToAddress2 || po.address2 || '',
      shipToCity: po.shipToCity || po.city || '',
      shipToPostCode: po.shipToPostCode || po.postCode || '',
      shipToCountry: po.shipToCountry || po.country || '',
      payToAddress: po.payToAddress || po.address || '',
      remarks: ''
    });

    this.itemsForm.clear();
    (po.items || []).forEach((line: any, index: number) => {
      const remainingQty = Math.max(0, (line.quantity || 0) - (line.totalQuantity || 0));
      const receivedQty = line.shippingQuantity !== null && line.shippingQuantity !== undefined
        ? line.shippingQuantity
        : remainingQty;
      // UnitCostExclVat strictly taken from PurchaseOrderLine.UnitCostExclVAT
      const unitCost = (line.unitCostExclVAT !== undefined && line.unitCostExclVAT !== null)
        ? Number(line.unitCostExclVAT)
        : (Number(line.unitPrice) || 0);

      this.itemsForm.push(
        this.fb.group({
          purchaseOrderLineId: [line.purchaseOrderLineId],
          lineNo: [line.lineNo || index + 1],
          itemNo: [line.itemNo || ''],
          itemName: [line.itemName || ''],
          itemDesc: [line.itemDescription || line.itemName || ''],
          orderedQty: [line.quantity || 0],
          unitCostExclVat: [unitCost],
          receivedQuantity: [receivedQty, [Validators.required, Validators.min(0)]],
          totalAmount: [receivedQty * unitCost],
          receivedDate: [this.getTodayDateString(), Validators.required],
          plannedReceiptDate: [this.formatDate(line.deliveryDate) || this.getTodayDateString()],
          expectedReceiptDate: [this.formatDate(line.deliveryDate) || this.getTodayDateString()],
          locationCode: [line.locationCode || po.locationCode || ''],
          remarks: ['']
        })
      );
    });

    this.viewMode = 'add';
    this.itemsExpanded = true;
    this.cdr.detectChanges();
  }

  onQuantityChange(index: number) {
    const ctrl = this.itemsForm.at(index);
    if (!ctrl) return;
    const qty = Number(ctrl.get('receivedQuantity')?.value) || 0;
    const unitCost = Number(ctrl.get('unitCostExclVat')?.value) || 0;
    ctrl.patchValue({ totalAmount: qty * unitCost }, { emitEvent: false });
    this.cdr.detectChanges();
  }

  calculateTotal(): number {
    if (!this.itemsForm) return 0;
    return this.itemsForm.controls.reduce((sum, ctrl) => {
      const total = Number(ctrl.get('totalAmount')?.value) || 0;
      return sum + total;
    }, 0);
  }

  viewGrn(grn: any) {
    this.loading = true;
    this.spinner.show();
    this.purchaseOrderService.getGoodsReceiptNoteDetail(grn.id).subscribe({
      next: (res: any) => {
        this.selectedGrn = res?.value || res || grn;
        this.viewMode = 'detail';
        this.loading = false;
        this.spinner.hide();
        this.cdr.detectChanges();
      },
      error: () => {
        this.selectedGrn = grn;
        this.viewMode = 'detail';
        this.loading = false;
        this.spinner.hide();
        this.cdr.detectChanges();
      }
    });
  }

  calculateDetailTotal(grn: any): number {
    if (!grn?.goodsReceiptItems) return 0;
    return grn.goodsReceiptItems.reduce((sum: number, item: any) => {
      const amount = item.amount || ((item.receivedQuantity || item.quantity || 0) * (item.unitCostExclVat || 0));
      return sum + amount;
    }, 0);
  }

  goBackToPoList() {
    this.router.navigate(['purchase-order']);
  }

  backToList() {
    this.viewMode = 'list';
    this.selectedGrn = null;
    this.loadGrnList();
    this.cdr.detectChanges();
  }

  toggleItems() {
    this.itemsExpanded = !this.itemsExpanded;
  }

  save() {
    if (this.saving) return;

    if (this.form.invalid) {
      this.toastr.warning('Please fill all required fields correctly.');
      return;
    }

    const itemsPayload = this.itemsForm.controls.map((ctrl) => ({
      purchaseOrderLineId: ctrl.get('purchaseOrderLineId')?.value,
      lineNo: ctrl.get('lineNo')?.value,
      itemNo: ctrl.get('itemNo')?.value,
      itemDesc: ctrl.get('itemDesc')?.value,
      orderedQuantity: Number(ctrl.get('orderedQty')?.value) || 0,
      receivedQuantity: Number(ctrl.get('receivedQuantity')?.value) || 0,
      quantity: Number(ctrl.get('receivedQuantity')?.value) || 0,
      unitCostExclVat: Number(ctrl.get('unitCostExclVat')?.value) || 0,
      receivedDate: ctrl.get('receivedDate')?.value
        ? new Date(ctrl.get('receivedDate')?.value)
        : new Date(),
      plannedReceiptDate: ctrl.get('plannedReceiptDate')?.value
        ? new Date(ctrl.get('plannedReceiptDate')?.value)
        : null,
      expectedReceiptDate: ctrl.get('expectedReceiptDate')?.value
        ? new Date(ctrl.get('expectedReceiptDate')?.value)
        : null,
      locationCode: ctrl.get('locationCode')?.value,
      remarks: ctrl.get('remarks')?.value
    }));

    const formVal = this.form.getRawValue();

    const grnPayload = {
      purchaseOrderNo: formVal.purchaseOrderNo,
      vendorNo: formVal.vendorNo,
      vendorName: formVal.vendorName,
      receiverName: formVal.receiverName,
      orderDate: formVal.orderDate ? new Date(formVal.orderDate) : null,
      postingDate: formVal.postingDate ? new Date(formVal.postingDate) : new Date(),
      documentDate: formVal.documentDate ? new Date(formVal.documentDate) : new Date(),
      dueDate: formVal.dueDate ? new Date(formVal.dueDate) : null,
      vendorCurrency: formVal.vendorCurrency,
      paymentMethod: formVal.paymentMethod,
      paymentTerms: formVal.paymentTerms,
      locationCode: formVal.locationCode,
      address: formVal.address,
      address2: formVal.address2,
      city: formVal.city,
      shipToName: formVal.shipToName,
      shipToAddress: formVal.shipToAddress,
      shipToAddress2: formVal.shipToAddress2,
      shipToCity: formVal.shipToCity,
      shipToPostCode: formVal.shipToPostCode,
      shipToCountry: formVal.shipToCountry,
      payToAddress: formVal.payToAddress,
      remarks: formVal.remarks,
      goodsReceiptItems: itemsPayload
    };

    Swal.fire({
      title: 'Confirm GRN Submission',
      text: 'Are you sure you want to submit this GRN?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, submit',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.saving = true;
      this.spinner.show();

      this.purchaseOrderService.createGoodsReceiptNote({
        purchaseOrderId: this.poId,
        goodsReceiptNote: grnPayload
      }).subscribe({
        next: (res: any) => {
          this.saving = false;
          this.spinner.hide();

          if (typeof res !== 'number' && res && res.isSuccess === false) {
            this.toastr.error(res?.message || 'Failed to create GRN.');
            return;
          }

          this.toastr.success('GRN created successfully.');
          this.loadGrnList();
          this.loadPurchaseOrderDetails();
          this.viewMode = 'list';
          this.openRatingModal();
        },
        error: (err: any) => {
          this.saving = false;
          this.spinner.hide();
          this.toastr.error(err?.error?.message || err?.message || 'Failed to create GRN.');
        }
      });
    });
  }

  // Rating Modal
  openRatingModal() {
    this.selectedRating = null;
    this.ratingComment.reset();
    this.hoverRating = null;
    this.hoverIndex = null;
    this.showRatingModal = true;
    this.cdr.detectChanges();
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
    this.spinner.show();
    this.purchaseOrderService.addVendorRating(payload).subscribe({
      next: () => {
        this.closeRatingModal();
        this.spinner.hide();
        this.toastr.success('Rating submitted successfully.');
      },
      error: () => {
        this.spinner.hide();
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
