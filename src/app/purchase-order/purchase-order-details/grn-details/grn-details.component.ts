import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LookupService } from 'app/shared/services/lookup.service';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

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

  paymentTermsList: any[] = [];
  paymentMethodsList: any[] = [];
  currencyList: string[] = ['USD', 'PKR', 'SAR', 'AED'];

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
    private lookupService: LookupService,
    private cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      grNumber: [{ value: '', disabled: true }],
      purchaseOrderNo: [{ value: '', disabled: true }],
      requestStatus: [{ value: '', disabled: true }],
      vendorNo: [''],
      vendorName: [''],
      receiverName: [''],
      postingDate: [''],
      documentDate: [''],
      dueDate: [''],
      orderDate: [''],
      vendorCurrency: [''],
      paymentTerms: [''],
      paymentMethod: [''],
      locationCode: [''],
      shipToPostCode: [''],
      address: [''],
      address2: [''],
      city: [''],
      shipToName: [''],
      shipToAddress: [''],
      shipToAddress2: [''],
      shipToCity: [''],
      shipToCountry: [''],
      payToAddress: [''],
      remarks: [''],
      items: this.fb.array([])
    });

    this.itemsForm = this.form.get('items') as FormArray;

    this.loadDropdowns();
    this.loadGrnOrPurchaseOrder();
  }

  get itemsControls() {
    return this.itemsForm.controls;
  }

  toggleItems() {
    this.itemsExpanded = !this.itemsExpanded;
  }

  private loadDropdowns() {
    this.lookupService.getPaymentTerms().subscribe({
      next: (res) => {
        this.paymentTermsList = res || [];
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    this.lookupService.getPaymentMethods().subscribe({
      next: (res) => {
        this.paymentMethodsList = res || [];
        this.cdr.detectChanges();
      },
      error: () => {}
    });
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
      requestStatus: grn.requestStatus,
      vendorNo: grn.vendorNo || '',
      vendorName: grn.vendorName || '',
      receiverName: grn.receiverName || '',
      postingDate: grn.postingDate ? grn.postingDate.split('T')[0] : null,
      documentDate: grn.documentDate ? grn.documentDate.split('T')[0] : null,
      dueDate: grn.dueDate ? grn.dueDate.split('T')[0] : null,
      orderDate: grn.orderDate ? grn.orderDate.split('T')[0] : null,
      vendorCurrency: grn.vendorCurrency || '',
      paymentTerms: grn.paymentTerms || '',
      paymentMethod: grn.paymentMethod || '',
      locationCode: grn.locationCode || '',
      shipToPostCode: grn.shipToPostCode || '',
      address: grn.address || '',
      address2: grn.address2 || '',
      city: grn.city || '',
      shipToName: grn.shipToName || '',
      shipToAddress: grn.shipToAddress || '',
      shipToAddress2: grn.shipToAddress2 || '',
      shipToCity: grn.shipToCity || '',
      shipToCountry: grn.shipToCountry || '',
      payToAddress: grn.payToAddress || '',
      remarks: grn.remarks || ''
    });

    this.itemsForm.clear();
    grn.goodsReceiptItems?.forEach((item: any) => {
      this.itemsForm.push(
        this.fb.group({
          purchaseOrderLineId: [item.purchaseOrderLineId],
          itemNo: [item.itemNo || ''],
          itemName: [item.itemName || ''],
          itemDesc: [item.itemDescription || item.itemName || ''],
          orderedQty: [item.orderedQuantity ?? item.quantity],
          unitCostExclVat: [item.unitCostExclVat],
          receivedQuantity: [item.receivedQuantity],
          receivedDate: [item.receivedDate ? item.receivedDate.split('T')[0] : null, Validators.required],
          plannedReceiptDate: [item.plannedReceiptDate ? item.plannedReceiptDate.split('T')[0] : null],
          expectedReceiptDate: [item.expectedReceiptDate ? item.expectedReceiptDate.split('T')[0] : null],
          remarks: [item.remarks || '']
        })
      );
    });

    this.cdr.detectChanges();
  }

  private patchFormFromPO(po: any) {
    const today = new Date().toISOString().split('T')[0];
    this.form.patchValue({
      purchaseOrderNo: po.purchaseOrderNo,
      requestStatus: po.requestStatus,
      vendorNo: po.vendorNo || '',
      vendorName: po.vendorName || po.vendorCompanyName || '',
      receiverName: po.receiverName || '',
      postingDate: po.postingDate ? po.postingDate.split('T')[0] : today,
      documentDate: po.documentDate ? po.documentDate.split('T')[0] : today,
      dueDate: po.dueDate ? po.dueDate.split('T')[0] : null,
      orderDate: po.orderDate ? po.orderDate.split('T')[0] : (po.createdDate ? po.createdDate.split('T')[0] : null),
      vendorCurrency: po.vendorCurrency || 'SAR',
      paymentTerms: po.paymentTerms || '',
      paymentMethod: po.paymentMethod || '',
      locationCode: po.locationCode || '',
      shipToPostCode: po.shipToPostCode || '',
      address: po.address || '',
      address2: po.address2 || '',
      city: po.city || '',
      shipToName: po.shipToName || '',
      shipToAddress: po.shipToAddress || '',
      shipToAddress2: po.shipToAddress2 || '',
      shipToCity: po.shipToCity || '',
      shipToCountry: po.shipToCountry || '',
      payToAddress: po.payToAddress || '',
      remarks: ''
    });

    this.itemsForm.clear();
    po.items?.forEach((line: any) => {
      this.itemsForm.push(
        this.fb.group({
          purchaseOrderLineId: [line.purchaseOrderLineId],
          itemNo: [line.itemNo || ''],
          itemName: [line.itemName || ''],
          itemDesc: [line.itemDescription || line.itemName || ''],
          orderedQty: [line.quantity],
          unitCostExclVat: [line.unitPrice],
          receivedQuantity: [line.shippingQuantity ?? line.quantity, [Validators.required, Validators.min(0)]],
          receivedDate: [today, Validators.required],
          plannedReceiptDate: [line.deliveryDate ? line.deliveryDate.split('T')[0] : null],
          expectedReceiptDate: [null],
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
        itemNo: ctrl.get('itemNo')?.value,
        itemDesc: ctrl.get('itemDesc')?.value,
        orderedQuantity: ctrl.get('orderedQty')?.value,
        quantity: ctrl.get('orderedQty')?.value,
        unitCostExclVat: ctrl.get('unitCostExclVat')?.value,
        receivedQuantity: ctrl.get('receivedQuantity')?.value != null ? Number(ctrl.get('receivedQuantity')?.value) : null,
        receivedDate: ctrl.get('receivedDate')?.value
          ? new Date(ctrl.get('receivedDate')?.value)
          : null,
        plannedReceiptDate: ctrl.get('plannedReceiptDate')?.value
          ? new Date(ctrl.get('plannedReceiptDate')?.value)
          : null,
        expectedReceiptDate: ctrl.get('expectedReceiptDate')?.value
          ? new Date(ctrl.get('expectedReceiptDate')?.value)
          : null,
        remarks: ctrl.get('remarks')?.value
      }));

      const formVal = this.form.getRawValue();

      const grnPayload = {
        vendorNo: formVal.vendorNo,
        vendorName: formVal.vendorName,
        receiverName: formVal.receiverName,
        postingDate: formVal.postingDate ? new Date(formVal.postingDate) : null,
        documentDate: formVal.documentDate ? new Date(formVal.documentDate) : null,
        dueDate: formVal.dueDate ? new Date(formVal.dueDate) : null,
        orderDate: formVal.orderDate ? new Date(formVal.orderDate) : null,
        vendorCurrency: formVal.vendorCurrency,
        paymentTerms: formVal.paymentTerms,
        paymentMethod: formVal.paymentMethod,
        locationCode: formVal.locationCode,
        shipToPostCode: formVal.shipToPostCode,
        address: formVal.address,
        address2: formVal.address2,
        city: formVal.city,
        shipToName: formVal.shipToName,
        shipToAddress: formVal.shipToAddress,
        shipToAddress2: formVal.shipToAddress2,
        shipToCity: formVal.shipToCity,
        shipToCountry: formVal.shipToCountry,
        payToAddress: formVal.payToAddress,
        remarks: formVal.remarks,
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
          this.vendorName = formVal.vendorName;
          this.purchaseOrderNo = formVal.purchaseOrderNo;
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
}
