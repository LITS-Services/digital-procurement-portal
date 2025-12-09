import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { PurchaseRequestAccountBudgetLookupModalComponent } from 'app/shared/modals/purchase-request-account-budget-lookup-modal/purchase-request-account-budget-lookup-modal.component';
import { PurchaseRequestExceptionPolicyComponent } from 'app/shared/modals/purchase-request-exception-policy/purchase-request-exception-policy.component';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { WorkflowServiceService } from 'app/shared/services/WorkflowService/workflow-service.service';
import { WorkflowApproverSetupComponent } from '../workflow-approver-setup/workflow-approver-setup.component';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { PermissionService } from 'app/shared/permissions/permission.service';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-workflow-master-setup',
  templateUrl: './workflow-master-setup.component.html',
  styleUrls: ['./workflow-master-setup.component.scss']
})
export class WorkflowMasterSetupComponent implements OnInit {
  FORM_IDS = FORM_IDS;
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
    private permissionService: PermissionService,
    public toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.getWorkflowMasterList();
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
    if(!this.permissionService.can(FORM_IDS.WORKFLOW_SETUP, 'write'))
      return;
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
    this.idsToDelete = this.chkBoxSelected.map(item => item.workflowMasterId);
    this.enableDisableButtons();
  }

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.chkBoxSelected = [...this.workflowMasterList];
    } else {
      this.chkBoxSelected = [];
    }
    this.idsToDelete = this.chkBoxSelected.map(item => item.workflowMasterId);
    this.isAllSelected = event.target.checked;
    this.enableDisableButtons();
  }

  enableDisableButtons() {
    const selectedCount = this.chkBoxSelected.length;
    this.isDeleteButtonDisabled = selectedCount === 0;
    this.isEditButtonDisabled = selectedCount !== 1;
    this.isOpenButtonDisabled = selectedCount === 0;
    this.isAllSelected = this.workflowMasterList.length === this.chkBoxSelected.length;
  }

  // Open Delete Modal
  openDeleteModal(): void {
    if(!this.permissionService.can(FORM_IDS.WORKFLOW_SETUP, 'delete')) 
      return;
    if (this.idsToDelete.length === 0) {
      this.toastr.info('Please select at least one record to delete.');
      return;
    }

    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete ${this.idsToDelete.length} workflow(s). This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        this.confirmDelete();
      }
    });
  }

  // CONFIRM DELETION OF WORKFLOW 
  confirmDelete(): void {
    if (this.idsToDelete.length === 0) return;

    this.WorkflowServiceService.deleteWorkflow(this.idsToDelete).subscribe({
      next: () => {
        Swal.fire('Deleted!', 'Selected record(s) have been deleted successfully.', 'success');
        this.getWorkflowMasterList();
        this.chkBoxSelected = [];
        this.idsToDelete = [];
      },
      error: (err) => {
        console.error('Delete failed:', err);
        Swal.fire('Error', 'An error occurred while deleting records.', 'error');
      }
    });
  }

  /**
   * Navigate to update form
   */
  onUpdate() {
    if(!this.permissionService.can(FORM_IDS.WORKFLOW_SETUP, 'write'))
      return;
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
      queryParams: { id: workflowMasterId, mode: 'Edit' }, skipLocationChange: true
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
