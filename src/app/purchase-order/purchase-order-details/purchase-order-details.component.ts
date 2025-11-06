import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';

@Component({
  selector: 'app-purchase-order-details',
  templateUrl: './purchase-order-details.component.html',
  styleUrls: ['./purchase-order-details.component.scss'],
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

export class PurchaseOrderDetailsComponent implements OnInit {
  poId!: number;
  poDetails: any;
  loading = true;
  itemsExpanded = true;
  selectedTab: any = 'po-details';
  constructor(
    private route: ActivatedRoute,
    private purchaseOrderService: PurchaseOrderService,
    public cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.poId = Number(this.route.snapshot.paramMap.get('id'));
    this.getPurchaseOrderDetails();
  }

  getPurchaseOrderDetails() {
    this.purchaseOrderService.getPurchaseOrderById(this.poId).subscribe(res => {
      this.poDetails = res;
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  toggleItems() {
    this.itemsExpanded = !this.itemsExpanded;
  }

  homePage() {
    this.router.navigate(['purchase-order']);
  }
    selectTab(tab: any) {
    this.selectedTab = tab;
  }
}