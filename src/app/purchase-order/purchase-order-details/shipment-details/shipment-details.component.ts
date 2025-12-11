import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';
import { ShipmentService } from 'app/shared/services/shipment.service';

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
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (this.poId) this.loadShipmentDetails();
    // this.getPurchaseOrderDetails();
  }
  
  loadShipmentDetails() {
    this.shipmentService.getShipmentDetailById(this.poId).subscribe({
      next: res => {
        this.shipmentDetails = res; // because your API returns Result<T>
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => this.loading = false
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
