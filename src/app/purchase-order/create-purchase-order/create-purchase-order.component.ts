import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { RowHeightCache } from '@swimlane/ngx-datatable';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-create-purchase-order',
  templateUrl: './create-purchase-order.component.html',
  styleUrls: ['./create-purchase-order.component.scss']
})
export class CreatePurchaseOrderComponent implements OnInit {
  @Input() purchaseRequestId!: number;
  items: any[] = [];
  selectedItemIds: number[] = [];
  loading = false;

  constructor(
    public activeModal: NgbActiveModal,
    private purchaseOrderService: PurchaseOrderService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadEligibleItems();
  }

  loadEligibleItems(): void {
    if (!this.purchaseRequestId) {
      console.error('purchaseRequestId is missing');
      return;
    }
    this.loading = true;
    this.purchaseOrderService.getItemsForPurchaseOrder(this.purchaseRequestId).subscribe({
      next: (res) => {
        this.items = res || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  toggleSelection(itemId: number, checked: boolean): void {
    if (checked) {
      this.selectedItemIds.push(itemId);
    } else {
      this.selectedItemIds = this.selectedItemIds.filter(id => id !== itemId);
    }
  }

  createPurchaseOrder(): void {
    if (this.selectedItemIds.length === 0) {
      this.toastr.warning('Please select at least one item.');
      return;
    }

    const payload = {
      purchaseRequestId: this.purchaseRequestId,
      itemIds: this.selectedItemIds
    };

    this.loading = true;
    this.purchaseOrderService.createPurchaseOrder(payload).subscribe({
      next: () => {
        this.activeModal.close(true);
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}