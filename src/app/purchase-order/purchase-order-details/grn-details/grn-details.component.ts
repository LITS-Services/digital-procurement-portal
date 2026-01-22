import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  // @Input() isShipmentAvailable: boolean = false;
  form!: FormGroup;
  itemsForm!: FormArray;
  grnId?: number;
  itemsExpanded: boolean = true;
  loading = true;
  isGrnSubmitted = false;

  constructor(
    private route: ActivatedRoute,
    private purchaseOrderService: PurchaseOrderService,
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
          this.isGrnSubmitted = true
          this.patchFormFromGRN(grn);
          this.form.disable({ emitEvent: false });
        } else {
          // If no GRN exists, load from PO
          this.purchaseOrderService.getPurchaseOrderById(this.poId).subscribe({
            next: (po) => {
              if (po) this.patchFormFromPO(po);
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
          receivedDate: [item.receivedDate ? item.receivedDate.split('T')[0] : null],
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
          receivedDate: [null],
          remarks: ['']
        })
      );
    });

    this.cdr.detectChanges();
  }

  save() {
    if (this.isGrnSubmitted) return;

    if (this.form.invalid) {
      this.toastr.warning('Please fill required fields.');
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
        next: () => {
          this.loadGrnOrPurchaseOrder();
        },
        error: () => this.toastr.error('Failed to create GRN.')
      });
    });
  }
}
