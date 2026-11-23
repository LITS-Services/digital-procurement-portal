import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';
import { ShipmentService } from 'app/shared/services/shipment.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-shipment-details',
  templateUrl: './shipment-details.component.html',
  styleUrls: ['./shipment-details.component.scss'],
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

export class ShipmentDetailsComponent implements OnInit {
  @Input() poId!: number;
  shipmentDetails: any;
  loading = true;
  poDetails: any;
  itemsExpanded = true;
  constructor(private shipmentService: ShipmentService,
    private purchaseOrderService: PurchaseOrderService,
    private cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    if (this.poId) this.loadShipmentDetails();
    // this.getPurchaseOrderDetails();
  }
  
  loadShipmentDetails() {
    this.loading = true;
    this.spinner.show();
    this.purchaseOrderService.getPurchaseOrderById(this.poId).subscribe({
      next: (po: any) => {
        this.poDetails = po;
        const items = po?.items || [];
        this.shipmentDetails = {
          shipmentDetailNo: po?.shipmentDetailNo || po?.purchaseOrderNo,
          vendorName: po?.vendorCompanyName || po?.vendorName,
          requestStatus: po?.requestStatus,
          shipmentDate: po?.estimatedDispatchDate || po?.createdDate,
          shipToName: po?.receiverName || po?.vendorName,
          country: po?.country || po?.shipToCountry,
          city: po?.city || po?.shipToCity,
          region: po?.region,
          shipToAddress: po?.address || po?.shipToAddress,
          shipToAddress2: po?.address2,
          postCode: po?.postCode || po?.shipToPostCode,
          notes: po?.remarks || '-',
          items: items.map((i: any) => ({
            itemName: i.itemName,
            orderedQty: i.quantity,
            shippingQuantity: i.shippingQuantity || i.quantity,
            deliveryDate: i.deliveryDate
          }))
        };
        this.loading = false;
        this.spinner.hide();
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.spinner.hide();
        this.cdr.detectChanges();
      }
    });
  }

  // getPurchaseOrderDetails() {
  //   this.purchaseOrderService.getPurchaseOrderById(this.poId).subscribe(res => {
  //     this.poDetails = res;
  //     this.loading = false;
  //     this.cdr.detectChanges();
  //   });
  // }

  toggleItems() {
    this.itemsExpanded = !this.itemsExpanded;
  }
}
