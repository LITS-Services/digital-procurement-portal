import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';
import { id } from 'date-fns/locale';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-purchase-order-details',
  templateUrl: './purchase-order-details.component.html',
  styleUrls: ['./purchase-order-details.component.scss'],
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
    private router: Router,
    public spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
    const id = params.get('id');
    if (id) {
      this.poId = +id; 
      this.getPurchaseOrderDetails(this.poId);
    }
  });
    
  }

getPurchaseOrderDetails(id: number) {
  this.spinner.show();

  this.purchaseOrderService.getPurchaseOrderById(id).subscribe({
    next: (res) => {
      this.poDetails = res;
      this.loading = false;
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.loading = false;
      console.error('PO Load Error', err);
    },
    complete: () => {
      this.spinner.hide();
    }
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