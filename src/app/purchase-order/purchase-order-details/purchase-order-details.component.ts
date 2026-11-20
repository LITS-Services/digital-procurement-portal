import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { PoRemarksComponent } from '../po-remarks/po-remarks.component';
import { PoApprovalHistoryComponent } from '../po-approval-history/po-approval-history.component';

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
    private toastr: ToastrService,
    private modalService: NgbModal
  ) { }

  get currentUserId(): string {
    return (localStorage.getItem('userId') || '').trim();
  }

  get isMainApprover(): boolean {
    const userId = this.currentUserId.toLowerCase();
    const approverId = (this.poDetails?.mainApproverId || '').toString().trim().toLowerCase();
    return !!userId && !!approverId && userId === approverId;
  }

  get isStatusInProgress(): boolean {
    const status = (this.poDetails?.requestStatus || '').toString().toLowerCase().replace(/[\s_-]/g, '');
    return status === 'inprogress';
  }

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

  onAddRemarks(action: 'Approve' | 'Reject'): void {
    if (!this.poDetails) return;

    const modalRef = this.modalService.open(PoRemarksComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.action = action;
    modalRef.componentInstance.purchaseOrderNo = this.poDetails.purchaseOrderNo;

    modalRef.result.then((result) => {
      if (result) {
        const payload = {
          PurchaseOrderId: this.poDetails.id,
          PurchaseOrderNo: this.poDetails.purchaseOrderNo,
          Remarks: result.remarks || '',
          ActionTaken: action,
          ApproverId: localStorage.getItem('userId')
        };

        this.spinner.show();
        this.purchaseOrderService.addRemarksWithActionTaken(payload)
          .pipe(finalize(() => this.spinner.hide()))
          .subscribe({
            next: (res: any) => {
              this.toastr.success(res?.message || `Purchase Order ${action}d successfully.`);
              this.router.navigate(['/purchase-order']);
            },
            error: (err: any) => {
              const errorMsg =
                err?.error?.message ||
                (Array.isArray(err?.error?.errors) && err.error.errors[0]) ||
                err?.statusText ||
                `Failed to ${action.toLowerCase()} Purchase Order.`;
              this.toastr.error(errorMsg);
            }
          });
      }
    }).catch(() => {});
  }

  openApprovalHistory(): void {
    if (!this.poDetails?.id) return;

    const modalRef = this.modalService.open(PoApprovalHistoryComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.purchaseOrderId = this.poDetails.id;
    modalRef.componentInstance.purchaseOrderNo = this.poDetails.purchaseOrderNo;
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