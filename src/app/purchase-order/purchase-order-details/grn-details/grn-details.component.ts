import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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
  grnDetails: any;
  itemsExpanded: boolean = true;
  constructor(private router: Router) { }

  ngOnInit(): void {
    // Dummy GRN Data
    this.grnDetails = {
      grnNo: 'GRN-2025-0012',
      poNo: 'PO-2025-0098',
      vendorName: 'ABC Industrial Supplies',
      deliveredBy: 'FastTrack Logistics',
      deliveryChallan: 'DC-847392',
      invoiceNo: 'INV-556728',
      receivedDate: '2025-02-12',
      warehouse: 'Central Stores',
      receivedBy: 'Muhammad Ahmed',
      remarks: 'All items received in good condition',
      items: [
        { itemName: 'Steel Bolts M8', orderedQty: 500, receivedQty: 500, balance: 0, uom: 'Nos' },
        { itemName: 'Washer 16mm', orderedQty: 500, receivedQty: 480, balance: 20, uom: 'Nos' },
        { itemName: 'Industrial Grease 1kg', orderedQty: 10, receivedQty: 10, balance: 0, uom: 'Bucket' }
      ]
    };
  }

     toggleItems() {
    this.itemsExpanded = !this.itemsExpanded;
  }

}
