import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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

  invoiceDetails: any;
  itemsExpanded: boolean = true;
  constructor(private router: Router) { }
  ngOnInit(): void {
    this.invoiceDetails = {
      invoiceNo: 'INV-2025-0045',
      poNo: 'PO-2025-0098',
      vendorName: 'ABC Industrial Supplies',
      invoiceDate: '2025-02-18',
      grnNo: 'GRN-2025-0012',
      deliveryChallan: 'DC-847392',
      paymentTerms: 'Net 30 Days',
      dueDate: '2025-03-20',
      subtotal: 185500,
      tax: 18550,
      otherCharges: 0,
      total: 204050,
      remarks: 'Invoice matches GRN and PO. Pending finance approval.',
      items: [
        { itemName: 'Steel Bolts M8', qty: 500, price: 150, amount: 75000 },
        { itemName: 'Washer 16mm', qty: 480, price: 20, amount: 9600 },
        { itemName: 'Industrial Grease 1kg', qty: 10, price: 10000, amount: 100000 }
      ]
    };
  }

   toggleItems() {
    this.itemsExpanded = !this.itemsExpanded;
  }

}