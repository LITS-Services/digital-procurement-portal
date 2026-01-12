import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';

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
  @Input() poId!: number;
  loading = true;
  invoiceDetails: any = {};
  itemsExpanded: boolean = true;
  constructor(private router: Router, private purchaseOrderService: PurchaseOrderService, private cdr: ChangeDetectorRef) { }
  ngOnInit(): void {
    if (this.poId) this.loadInvoiceDetails();
  }

  loadInvoiceDetails() {
    this.purchaseOrderService.getInvoiceByPoId(this.poId).subscribe({
      next: res => {
        this.invoiceDetails = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => this.loading = false
    });
  }

  toggleItems() {
    this.itemsExpanded = !this.itemsExpanded;
  }
}