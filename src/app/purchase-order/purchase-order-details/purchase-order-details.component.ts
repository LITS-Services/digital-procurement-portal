import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';
import { id } from 'date-fns/locale';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

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
    public spinner: NgxSpinnerService,
    private toastr: ToastrService
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
  this.loading = true;
  this.spinner.show();

  this.purchaseOrderService.getPurchaseOrderById(id)
    .pipe(
      finalize(() => {
        this.loading = false;
        this.spinner.hide();
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (res) => {
        this.poDetails = res;
      },
      error: (err) => {
        console.error('PO Load Error', err);
        const errorMsg =
          err?.error?.message ||
          (Array.isArray(err?.error?.errors) && err.error.errors[0]) ||
          err?.statusText ||
          'Failed to load purchase order details.';
        this.toastr.error(errorMsg);
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