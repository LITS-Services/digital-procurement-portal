import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { PurchaseRequestAccountBudgetLookupModalComponent } from 'app/shared/modals/purchase-request-account-budget-lookup-modal/purchase-request-account-budget-lookup-modal.component';
import { PurchaseRequestExceptionPolicyComponent } from 'app/shared/modals/purchase-request-exception-policy/purchase-request-exception-policy.component';

@Component({
  selector: 'app-purchase-request',
  templateUrl: './purchase-request.component.html',
  styleUrls: ['./purchase-request.component.scss']
})
export class PurchaseRequestComponent implements OnInit {
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  purchaseRequestData: any[] = [];
  public chkBoxSelected: any[] = [];
  public idsToDelete: number[] = []; // IDs to delete
  loading = false;
  columns: any[] = [];
  announcementId: number;
  isEditButtonDisabled: boolean = true;
  isDeleteButtonDisabled: boolean = true;
  isOpenButtonDisabled: boolean = true;
  isAddNewDisable: boolean = true;
  isAllSelected: boolean = false;

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private purchaseRequestService: PurchaseRequestService
  ) {}

  ngOnInit(): void {
    this.loadPurchaseRequests();
  }

  loadPurchaseRequests() {
    this.loading = true;
    this.purchaseRequestService.getPurchaseRequests().subscribe({
      next: (data) => {
        this.purchaseRequestData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching requests:', err);
        this.loading = false;
      }
    });
  }

  saveRequest() {
    const payload = {
      requisitionNo: 'REQ002',
      status: 'Pending',
      date: new Date(),
      owner: 'Ali',
      department: 'IT',
      title: 'New Hardware Purchase'
    };

    this.purchaseRequestService.createPurchaseRequestWithFiles(payload).subscribe({
      next: (res) => console.log('Saved successfully', res),
      error: (err) => console.error('Save failed', err)
    });
  }

  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  openEmpDetails() {
    this.router.navigate(['/purchase-request/new-purchase-request']);
  }

  onSort(event) {
    this.loading = true;
    setTimeout(() => {
      const rows = [...this.purchaseRequestData];
      const sort = event.sorts[0];
      rows.sort((a, b) => {
        return a[sort.prop].localeCompare(b[sort.prop]) * (sort.dir === 'desc' ? -1 : 1);
      });
      this.purchaseRequestData = rows;
      this.loading = false;
    }, 1000);
  }

  // Checkbox selection handling
  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [...selected];
this.idsToDelete = this.chkBoxSelected.map(item => item.requestId);
    this.announcementId = selected[0]?.id;
    
    this.enableDisableButtons();
  }

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.chkBoxSelected = [...this.purchaseRequestData];
    } else {
      this.chkBoxSelected = [];
    }
    this.idsToDelete = this.chkBoxSelected.map(item => item.requestId);
    this.isAllSelected = event.target.checked;
    this.enableDisableButtons();
  }

  enableDisableButtons() {
    const selectedRowCount = this.chkBoxSelected.length;
    this.isDeleteButtonDisabled = selectedRowCount === 0;
    this.isEditButtonDisabled = selectedRowCount !== 1;
    this.isOpenButtonDisabled = selectedRowCount === 0;
    this.isAllSelected = this.purchaseRequestData.length === this.chkBoxSelected.length;
  }

  // Delete modal open
  openDeleteModal(deleteModal) {
    if (this.idsToDelete.length > 0) {
      this.modalService.open(deleteModal, { backdrop: 'static', centered: true });
    } else {
      alert('Please select at least one record to delete.');
    }
  }

  // Confirm delete action
confirmDelete() {
  if (this.idsToDelete.length === 0) return;

console.log('Deleting IDs:', this.idsToDelete);

 this.purchaseRequestService.deletePurchaseRequest(this.idsToDelete)
 .subscribe({
    next: () => {
      this.modalService.dismissAll();
      this.loadPurchaseRequests(); // Reload updated data
      this.chkBoxSelected = [];
      this.idsToDelete = [];
    },
    error: (err) => {
      console.error('Delete failed:', err);
    }
  });
}

onUpdate() {
  if (!this.chkBoxSelected || this.chkBoxSelected.length === 0) {
    alert("Please select a record to update.");
    return;
  }

  if (this.chkBoxSelected.length > 1) {
    alert("Please select only one record to update.");
    return;
  }

  const selectedId = this.chkBoxSelected[0].requestId;  // use requestId column
  console.log("Navigating to update ID:", selectedId);

  this.router.navigate(['/new-purchase-request', selectedId]);
}


  openAblModal() {
    const modalRef = this.modalService.open(PurchaseRequestAccountBudgetLookupModalComponent, {
      backdrop: 'static',
      size: 'xl',
      centered: true,
    });
    modalRef.result.then((result) => {}, (reason) => {});
  }

  openExceptionPolicyModal() {
    const modalRef = this.modalService.open(PurchaseRequestExceptionPolicyComponent, {
      backdrop: 'static',
      size: 'lg',
      centered: true,
    });
    modalRef.result.then((result) => {}, (reason) => {});
  }
}
