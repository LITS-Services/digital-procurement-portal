import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { PurchaseRequestAccountBudgetLookupModalComponent } from 'app/shared/modals/purchase-request-account-budget-lookup-modal/purchase-request-account-budget-lookup-modal.component';
import { PurchaseRequestExceptionPolicyComponent } from 'app/shared/modals/purchase-request-exception-policy/purchase-request-exception-policy.component';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { WorkflowServiceService } from 'app/shared/services/WorkflowService/workflow-service.service';
import { WorkflowApproverSetupComponent } from '../workflow-approver-setup/workflow-approver-setup.component';
@Component({
  selector: 'app-workflow-master-setup',
  templateUrl: './workflow-master-setup.component.html',
  styleUrls: ['./workflow-master-setup.component.scss']
})
export class WorkflowMasterSetupComponent implements OnInit {

  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  purchaseRequestData: any[] = [];
  chkBoxSelected: any[] = [];
  idsToDelete: number[] = [];
  loading = false;
  announcementId: number;
  isEditButtonDisabled = true;
  isDeleteButtonDisabled = true;
  isOpenButtonDisabled = true;
  isAllSelected = false;
  workflowMasterList: any[] = [];


  constructor(
    private router: Router,
    private modalService: NgbModal,
    private purchaseRequestService: PurchaseRequestService,
    private WorkflowServiceService: WorkflowServiceService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.getWorkflowMasterList();
    //this.loadPurchaseRequests();
  }

  /**
   * Load purchase requests from API and group clones
   */
  loadPurchaseRequests() {
    this.loading = true;

    this.purchaseRequestService.getPurchaseRequests().subscribe({
      next: (data) => {
        // 🔹 Group requests by requestId
        const grouped = data.reduce((acc, item) => {
          const existing = acc.find(x => x.requestId === item.requestId);

          if (existing) {
            existing.clones.push({
              itemDescription: item.itemDescription,
              vendor: item.vendor,
              account: item.account,
              amount: item.amount
            });
          } else {
            acc.push({
              requestId: item.requestId,
              requisitionNo: item.requisitionNo,
              status: item.status,
              submittedDate: item.submittedDate,
              createdBy: item.createdBy,
              department: item.department,
              clones: [
                {
                  itemDescription: item.itemDescription,
                  vendor: item.vendor,
                  account: item.account,
                  amount: item.amount
                }
              ]
            });
          }
          return acc;
        }, []);

        this.purchaseRequestData = grouped;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching requests:', err);
        this.loading = false;
      }
    });
  }


  getWorkflowMasterList(): void {
    //    this.loading = true;
    this.WorkflowServiceService.getWorkflowMasterList().subscribe({
      next: (data: any) => {
        console.log("Raw API Response:", data);

        // Fix: Extract $values if it exists
        this.workflowMasterList = data.$values ?? data;
        //this.loading = false;

        console.log("Extracted WorkflowMasters List:", this.workflowMasterList);
        this.cdr.detectChanges();
      },
      error: (err) => {
        //this.loading = false;
        console.error("Error fetching WorkflowMaster List:", err);
      }
    });
  }

  /**
   * Navigate to dashboard home
   */
  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  /**
   * Navigate to create new purchase request
   */
  openEmpDetails() {
    this.router.navigate(['/purchase-request/new-purchase-request']);
  }

  setupnewWorkflow() {
    this.router.navigate(['/setup/create-workflow']);
  }

  /**
   * Handle sorting
   */
  onSort(event) {
    this.loading = true;
    setTimeout(() => {
      const sort = event.sorts[0];
      this.purchaseRequestData.sort((a, b) => {
        const aValue = (a[sort.prop] ?? '').toString();
        const bValue = (b[sort.prop] ?? '').toString();
        return aValue.localeCompare(bValue) * (sort.dir === 'desc' ? -1 : 1);
      });
      this.loading = false;
    }, 200);
  }

  /**
   * Checkbox selection
   */
  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [...selected];
    this.idsToDelete = this.chkBoxSelected.map(item => item.requestId);
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
    const selectedCount = this.chkBoxSelected.length;
    this.isDeleteButtonDisabled = selectedCount === 0;
    this.isEditButtonDisabled = selectedCount !== 1;
    this.isOpenButtonDisabled = selectedCount === 0;
    this.isAllSelected = this.purchaseRequestData.length === this.chkBoxSelected.length;
  }

  /**
   * Open Delete Modal
   */
  openDeleteModal(deleteModal) {
    if (this.idsToDelete.length > 0) {
      this.modalService.open(deleteModal, { backdrop: 'static', centered: true });
    } else {
      alert('Please select at least one record to delete.');
    }
  }

  /**
   * Confirm deletion of selected requests
   */
  confirmDelete() {
    if (this.idsToDelete.length === 0) return;

    console.log('Deleting IDs:', this.idsToDelete);

    this.purchaseRequestService.deletePurchaseRequest(this.idsToDelete).subscribe({
      next: () => {
        this.modalService.dismissAll();
        this.loadPurchaseRequests();
        this.chkBoxSelected = [];
        this.idsToDelete = [];
      },
      error: (err) => {
        console.error('Delete failed:', err);
      }
    });
  }

  /**
   * Navigate to update form
   */
  onUpdate() {
    if (this.chkBoxSelected.length === 0) {
      alert('Please select a record to update.');
      return;
    }

    if (this.chkBoxSelected.length > 1) {
      alert('Please select only one record to update.');
      return;
    }

    const workflowMasterId = this.chkBoxSelected[0].workflowMasterId;
    console.log('Navigating to update ID:', workflowMasterId);
  this.router.navigate(['/setup/create-workflow'], {
      queryParams: { id: workflowMasterId, mode: 'Edit' }
    });
  }

  
  openApproverModal(row: any): void {
    const modalRef = this.modalService.open(WorkflowApproverSetupComponent, {
      size: 'lg', backdrop: 'static', centered: true
    });

    // Pass the ID right away
    modalRef.componentInstance.workflowMasterId = row.workflowMasterId;
  }


}
