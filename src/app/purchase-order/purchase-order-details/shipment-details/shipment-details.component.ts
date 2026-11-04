import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
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
export class ShipmentDetailsComponent implements OnInit, OnChanges {
  @Input() poId!: number;
  shipmentData: any = null;
  loading = false;
  itemsExpanded = true;

  // Selected item for viewing shipment lines modal
  selectedItem: any = null;
  showShipmentsModal = false;

  constructor(
    private shipmentService: ShipmentService,
    private cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    if (this.poId) {
      this.loadShipmentDetails();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['poId'] && !changes['poId'].firstChange && this.poId) {
      this.loadShipmentDetails();
    }
  }

  loadShipmentDetails(): void {
    this.loading = true;
    this.spinner.show();
    this.shipmentService.getShipmentDetailById(this.poId).subscribe({
      next: (res: any) => {
        this.shipmentData = res;
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

  toggleItems(): void {
    this.itemsExpanded = !this.itemsExpanded;
  }

  viewShipments(item: any): void {
    this.selectedItem = item;
    this.showShipmentsModal = true;
    this.cdr.detectChanges();
  }

  closeShipmentsModal(): void {
    this.showShipmentsModal = false;
    this.selectedItem = null;
    this.cdr.detectChanges();
  }

  hasShipments(item: any): boolean {
    return !!(item?.shipmentLines && item.shipmentLines.length > 0);
  }
}
