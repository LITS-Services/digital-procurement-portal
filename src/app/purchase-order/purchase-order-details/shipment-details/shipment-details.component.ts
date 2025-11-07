import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ShipmentService } from 'app/shared/services/shipment.service';

@Component({
  selector: 'app-shipment-details',
  templateUrl: './shipment-details.component.html',
  styleUrls: ['./shipment-details.component.scss']
})
export class ShipmentDetailsComponent implements OnInit {
  @Input() poId!: number;
  shipmentDetails: any;
  loading = true;
  constructor(private shipmentService: ShipmentService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (this.poId) this.loadShipmentDetails();

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
}
