import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbAccordion, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { PurchaseRequestAttachmentModalComponent } from 'app/shared/modals/purchase-request-attachment-modal/purchase-request-attachment-modal.component';
import { WorkflowServiceService } from 'app/shared/services/WorkflowService/workflow-service.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-new-workflowmaster-setup',
  templateUrl: './new-workflowmaster-setup.component.html',
  styleUrls: ['./new-workflowmaster-setup.component.scss']
})
export class NewWorkflowmasterSetupComponent implements OnInit {

  numberOfAttachments = 0;
  newApproverData = [];
  workflowsetupform: FormGroup;
  approverForm: FormGroup;
  editingRowIndex: number | null = null; // Track row being edited
  public chkBoxSelected = [];
  loading = false;
  public rows = [];
  columns = [];
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  workflowmasterId: number | null = null;
  workflowTypes: any[] = [];
  approverList: any[] = [];
  usersList: any[] = [];
  editableWorkFlowMasterId: number | null = null;
  @ViewChild('accordion') accordion: NgbAccordion;
  @ViewChild(DatatableComponent) table: DatatableComponent;
  mode: string = 'Create';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private WorkflowServiceService: WorkflowServiceService,
    private fb: FormBuilder,
    public toastr: ToastrService
  ) {
  }

  ngOnInit(): void {

    // Main form
    this.getDepartmentUsersList();
    this.getWorkflowTypes();
    this.getApproverList();

    this.workflowsetupform = this.fb.group({
      workflowName: ['', Validators.required],
      documentType: ['', Validators.required],
      status: [false],
      usersList: [[]]
    });

    // Approver form (no validations)
    this.approverForm = this.fb.group({
      approverList: ['', Validators.required],
      amountFrom: [null],
      amountTo: [null],
      approverLevel: [null,Validators.required],
      canApprove: [false],
      canReject: [false],
      canSendBack: [false],
      canSubmit: [false],
      isApprovalCompulsory: [false],
      approverName: [null],
      userId: [null]
    });


    // Check if editing existing request
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      this.mode = params.get('mode') || 'Create';
      const mode = params.get('mode');
      this.workflowmasterId = id ? Number(id) : 0;
      if (mode == 'Edit') {
        this.loadexistingWorkflowById(this.workflowmasterId);
      }

    });

  }

  getWorkflowTypes(): void {
    this.WorkflowServiceService.getWorkflowTypes().subscribe({
      next: (data: any) => {
        console.log("Raw API Response:", data);

        // Fix: Extract $values if it exists
        this.workflowTypes = data.$values ?? data;

        console.log("Extracted Workflow Types:", this.workflowTypes);
      },
      error: (err) => {
        console.error("Error fetching workflow types:", err);
      }
    });
  }

  getApproverList(): void {
    this.WorkflowServiceService.getApproverList().subscribe({
      next: (data: any) => {
        console.log("Raw API Response:", data);

        // Fix: Extract $values if it exists
        this.approverList = data.$values ?? data;

        console.log("Extracted Approver List:", this.approverList);
      },
      error: (err) => {
        console.error("Error fetching approver list:", err);
      }
    });
  }

  getDepartmentUsersList(): void {
    this.WorkflowServiceService.getApproverList().subscribe({
      next: (data: any) => {
        console.log("Raw API Response:", data);

        // Fix: Extract $values if it exists
        this.usersList = data.$values ?? data;

        console.log("Extracted Approver List:", this.usersList);
      },
      error: (err) => {
        console.error("Error fetching approver list:", err);
      }
    });
  }



  addApprover(): void {
    if (this.approverForm.invalid) {
      console.warn("Approver form is invalid");
      return;
    }
    const formValue = { ...this.approverForm.value };
    // Find the selected approver's display name
    const selectedApprover = this.approverList.find(a => a.id === formValue.approverList);

    const userId = selectedApprover ? selectedApprover.id : null;
    const approverLevel = formValue.approverLevel;
    //Check duplicates BEFORE creating the object
    const sameUserExists = this.newApproverData.some((item, index) =>
      index !== this.editingRowIndex && item.approverList === userId
    );
    if (sameUserExists) {
      this.toastr.warning("This approver is already added!", "");
      return;
    }
    const sameLevelExists = this.newApproverData.some((item, index) =>
      index !== this.editingRowIndex && item.approverLevel === approverLevel
    );

    if (sameLevelExists) {
      this.toastr.warning("This approver level is already used!", "");
      return;
    }

    if(formValue.amountFrom > formValue.amountTo)
    {
       this.toastr.warning("Amount from should less than amount to.", "");
      return;
    }

    const newItem = {
      ...formValue,
      approverName: selectedApprover ? selectedApprover.userName : '',
      userId: selectedApprover.userId
    };
    if (this.editingRowIndex !== null) {
      // Update existing row
      this.newApproverData[this.editingRowIndex] = newItem;
      this.editingRowIndex = null;
    } else {
      // Add new row
      this.newApproverData = [...this.newApproverData, newItem];
    }
    // Refresh table
    this.newApproverData = [...this.newApproverData];
    // Reset form
    this.approverForm.reset({
      approverList: '',
      amountFrom: null,
      amountTo: null,
      approverLevel: null,
      canApprove: false,
      canReject: false,
      canSendBack: false,
      canSubmit: false,
      isApprovalCompulsory: false,
      approverName: null,
      userId: null,
      WorkflowDetailsId: null
    });
  }

  // Edit a row
  editRow(row: any, rowIndex: number) {
    this.approverForm.patchValue({
      approverList: row.approverList,
      amountFrom: row.amountFrom,
      amountTo: row.amountTo,
      approverLevel: row.approverLevel,
      canApprove: row.canApprove,
      canReject: row.canReject,
      canSendBack: row.canSendBack,
      canSubmit: row.canSubmit,
      isApprovalCompulsory: row.isApprovalCompulsory,
      approverName: row.approverName,
      WorkflowDetailsId: row.WorkflowDetailsId,
    });
    this.editingRowIndex = rowIndex;
  }

  // Delete a row
  deleteRow(rowIndex: number): void {
    this.newApproverData.splice(rowIndex, 1);
    this.newApproverData = [...this.newApproverData]; // refresh table
    this.toastr.success('Approver deleted!', '');
  }

  homePage() {
    this.router.navigate(['/setup/workflow']);
  }

  submitForm() {
    if (!this.workflowsetupform.valid) {
      console.warn('Form is invalid');
      return;
    }

    const f = this.workflowsetupform.value;

    const selectedUsers = f.usersList || [];

    // Map approvers -> workflowDetails
    const workflowDetails = this.newApproverData.map(a => ({
      approverList: a.approverList || '',
      userID: a.approverList || '',
      amountFrom: Number(a.amountFrom) || 0,
      amountTo: Number(a.amountTo) || 0,
      approverLevel: Number(a.approverLevel) || 0,
      canApprove: !!a.canApprove,
      canReject: !!a.canReject,
      canSendBack: !!a.canSendBack,
      canSubmit: !!a.canSubmit,
      isApprovalCompulsory: !!a.isApprovalCompulsory,
      //WorkflowDetailsId :!!a.WorkflowDetailsId,
    }));

    // Final payload matches WorkflowVM
    const payload = {
      workflowMasterId: 0, // 0 for new, or set existing Id for update
      workflowTypeId: f.documentType, // <-- dropdown selected value (id)
      workflowName: f.workflowName,
      isActive: f.status === true,
      createdDate: new Date().toISOString(),
      users: selectedUsers,
      workflowDetails: workflowDetails
    };

    this.loading = true;

    this.WorkflowServiceService.setUpWorkflow(payload).subscribe({
      next: (res) => {
        this.toastr.success('Workflow saved successfully!', '');
        this.loading = false;

        // Reset form + list
        this.workflowsetupform.reset({
          workflowName: '',
          documentType: '',
          status: false
        });
        this.newApproverData = [];
        this.router.navigateByUrl('/setup/workflow');

      },
      error: (err) => {
        console.error('Error saving workflow:', err);
        this.toastr.error('Failed to save workflow', '');
        this.loading = false;
      }
    });
  }



  loadexistingWorkflowById(id: number) {

    this.WorkflowServiceService.GetWorkflowById(id).subscribe({
      next: (data) => {
        const master = data.$values[0];

        // master.users might be wrapped with $values
        const selectedUsers: string[] = master.users?.$values ?? [];

        // Now filter against usersList
        const validSelectedUsers = this.usersList
          .filter((u: any) => selectedUsers.includes(u.id))
          .map((u: any) => u.id);

        this.workflowmasterId = master.workflowMasterId;
        this.workflowsetupform.patchValue({
          workflowName: master.workflowName,
          documentType: master.workflowTypeId,
          status: master.isActive,
          usersList: selectedUsers
        });
        if (master.workflowDetails?.$values?.length) {
          this.newApproverData = master.workflowDetails.$values.map((d: any) => ({
            approverName: d.approverName || '',
            approverList: d.userId || '',
            amountFrom: d.amountFrom,
            amountTo: d.amountTo,
            approverLevel: d.approverLevel,
            canApprove: d.canApprove,
            canReject: d.canReject,
            canSendBack: d.canSendBack,
            canSubmit: d.canSubmit,
            isApprovalCompulsory: d.isApprovalCompulsory,
            userId: d.userId,
            workflowDetailsId: d.workflowDetailsId,
          }));
        } else {
          this.newApproverData = [];
        }
      },
      error: (err) => console.error('Failed to load workflow:', err)
    });
  }

  updateForm() {
    if (!this.workflowsetupform.valid) {
      console.warn('Form is invalid');
      return;
    }

    const f = this.workflowsetupform.value;

    const selectedUsers = f.usersList || [];
    // Map approvers -> workflowDetails
    const workflowDetails = this.newApproverData.map(a => ({
      WorkflowMasterId: this.workflowmasterId,
      WorkflowDetailsId: a.workflowDetailsId,
      approverList: a.approverList || '',
      userId: a.approverList || '',
      amountFrom: Number(a.amountFrom) || 0,
      amountTo: Number(a.amountTo) || 0,
      approverLevel: Number(a.approverLevel) || 0,
      canApprove: !!a.canApprove,
      canReject: !!a.canReject,
      canSendBack: !!a.canSendBack,
      canSubmit: !!a.canSubmit,
      isApprovalCompulsory: !!a.isApprovalCompulsory
    }));

    // Final payload matches WorkflowVM
    const payload = {
      workflowMasterId: this.workflowmasterId,
      workflowTypeId: f.documentType,
      workflowName: f.workflowName,
      isActive: f.status === true,
      createdDate: new Date().toISOString(),
      workflowDetails: workflowDetails,
      users: selectedUsers,
    };

    this.loading = true;

    this.WorkflowServiceService.updateWorkflowdetails(payload).subscribe({
      next: (res) => {
        this.toastr.success('Workflow updated successfully!', '');
        this.loading = false;

        // Reset form + list
        this.workflowsetupform.reset({
          workflowName: '',
          documentType: '',
          status: false
        });
        this.newApproverData = [];
        this.router.navigateByUrl('/setup/workflow');
      },
      error: (err) => {
        console.error('Error updating workflow:', err);
        this.toastr.error('Failed to update workflow', '');
        this.loading = false;
      }
    });
  }


}
