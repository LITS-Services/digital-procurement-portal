import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbAccordion, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { PurchaseRequestAttachmentModalComponent } from 'app/shared/modals/purchase-request-attachment-modal/purchase-request-attachment-modal.component';
import { CompanyService } from 'app/shared/services/Company.services';
import { WorkflowServiceService } from 'app/shared/services/WorkflowService/workflow-service.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-new-workflowmaster-setup',
  templateUrl: './new-workflowmaster-setup.component.html',
  styleUrls: ['./new-workflowmaster-setup.component.scss']
})
export class NewWorkflowmasterSetupComponent implements OnInit {
  selectedEntityIdForWorkflow: number | null = null;

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
  entitiesList: any[] = [];
  isVendorOnboarding: boolean = false;
  dataLoaded = false;

  // NEW: Conditional field flag
  hideConditionalFields = false;

  constructor(
    private companyService: CompanyService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private WorkflowServiceService: WorkflowServiceService,
    private fb: FormBuilder,
    public toastr: ToastrService
  ) { }

  ngOnInit(): void {

    // Main form
    this.getDepartmentUsersList();
    this.getWorkflowTypes();
    this.getApproverList();

    this.workflowsetupform = this.fb.group({
      workflowName: ['', Validators.required],
      documentType: ['', Validators.required],
      status: [false],
      usersList: [[]],
    });

    // 👇 Automatically load Procurement Companies on component load
    this.getEntities();  // <---- 🆕 Add this line

    // Watch for workflow type changes to hide/show fields
    this.workflowsetupform.get('documentType')?.valueChanges.subscribe(value => {
      this.updateConditionalFields(value);
    });

    // Approver form (no validations)
    this.approverForm = this.fb.group({
      workflowDetailsId: [null],
      approverList: ['', Validators.required],
      amountFrom: [null],
      amountTo: [null],
      approverLevel: [null, Validators.required],
      canApprove: [false],
      canReject: [false],
      canSendBack: [false],
      canSubmit: [false],
      isApprovalCompulsory: [false],
      approverName: [null],
      userId: [null],
      proxyApproverId: [''],
      proxyApproverName: [null],
      graceDays: [null],
    });

    // Check if editing existing request
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      this.mode = params.get('mode') || 'Create';
      this.workflowmasterId = id ? Number(id) : 0;
      if (this.mode === 'Edit') {
        this.loadexistingWorkflowById(this.workflowmasterId);
      }
    });
  }

  // NEW: Update conditional fields based on selected workflow type
  updateConditionalFields(selectedTypeId: any) {
    const selectedType = this.workflowTypes.find(wf => wf.id == selectedTypeId);

    if (selectedType?.typeName === 'Vendor Company Onboarding') {
      this.isVendorOnboarding = true;
      this.hideConditionalFields = true;

      // Reset users selection
      this.workflowsetupform.get('usersList')?.reset();
      this.workflowsetupform.get('usersList')?.enable();

      // Disable Amount fields in approver form
      this.approverForm.get('amountFrom')?.disable();
      this.approverForm.get('amountTo')?.disable();

      // Fetch Entities for dropdown
      this.getEntities();

      // Clear previous approvers
      this.approverList = [];
      this.approverForm.get('approverList')?.reset();

    } else {
      this.isVendorOnboarding = false;
      this.hideConditionalFields = false;

      // Restore Amount fields
      this.approverForm.get('amountFrom')?.enable();
      this.approverForm.get('amountTo')?.enable();

      // Restore Users List from default approvers
      this.getDepartmentUsersList();
    }
  }

  getEntities(): void {
    this.companyService.getProCompanies().subscribe({
      next: (res: any) => {
        this.entitiesList = res.result || [];
        this.dataLoaded = true;   // <-- mark as loaded here
      },
      error: (err) => {
        console.error('Error fetching entities:', err);
        this.dataLoaded = true;   // or false depending on your UX (maybe show error UI)
      }
    });
  }

  onEntitySelected(entityId: number) {
    if (!entityId) return;

    this.selectedEntityIdForWorkflow = entityId;
    this.loading = true;
    this.companyService.getUserByEntity(entityId).subscribe({
      next: (res: any) => {
        const users = res?.result || [];
        if (this.isVendorOnboarding) {
          this.approverList = users;
          this.approverForm.get('approverList')?.reset();
          // ❌ DO NOT modify usersList form control here
        } this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching entity users:', err);
        this.loading = false;
      }
    });
  }

  getWorkflowTypes(): void {
    this.WorkflowServiceService.getWorkflowTypes().subscribe({
      next: (data: any) => {
        console.log("Raw API Response:", data);
        this.workflowTypes = data ?? data;
        console.log("Extracted Workflow Types:", this.workflowTypes);
      },
      error: (err) => console.error("Error fetching workflow types:", err)
    });
  }

  getApproverList(): void {
    this.WorkflowServiceService.getApproverList().subscribe({
      next: (data: any) => {
        console.log("Raw API Response:", data);
        this.approverList = data ?? data;
        console.log("Extracted Approver List:", this.approverList);
      },
      error: (err) => console.error("Error fetching approver list:", err)
    });
  }

  getDepartmentUsersList(): void {
    this.WorkflowServiceService.getApproverList().subscribe({
      next: (data: any) => {
        console.log("Raw API Response:", data);
        this.usersList = data ?? data;
        console.log("Extracted Approver List:", this.usersList);
      },
      error: (err) => console.error("Error fetching approver list:", err)
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
    const selectedProxyApprover = this.approverList.find(a => a.id === formValue.proxyApproverId);

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

    if (formValue.amountFrom > formValue.amountTo) {
      this.toastr.warning("Amount from should less than amount to.", "");
      return;
    }

    const newItem = {
      ...formValue,
      approverName: selectedApprover ? selectedApprover.userName : '',
      userId: selectedApprover.userId,
      proxyApproverName: selectedProxyApprover?.userName || '',
      workflowDetailsId: this.newApproverData[this.editingRowIndex]?.workflowDetailsId
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
      workflowDetailsId: null,
      proxyApproverId: null,
      proxyApproverName: null,
      graceDays: null
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
      workflowDetailsId: row.workflowDetailsId,
      proxyApproverId: row.proxyApproverId,
      proxyApproverName: row.proxyApproverName,
      graceDays: row.graceDays
    });
    this.editingRowIndex = rowIndex;
  }

  // Delete a row
  deleteRow(rowIndex: number): void {
    this.newApproverData.splice(rowIndex, 1);
    this.newApproverData = [...this.newApproverData]; // refresh table
    this.toastr.success('Approver deleted!', '');
    this.approverForm.reset();
  }

  homePage() {
    this.router.navigate(['/setup/workflow']);
  }

  submitForm() {
    if (!this.workflowsetupform.valid) return;

    const f = this.workflowsetupform.value;
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
      proxyApproverId: a.proxyApproverId || '',
      graceDays: Number(a.graceDays) || 0

    }));

    let payload: any = {
      workflowMasterId: 0,
      workflowTypeId: f.documentType,
      workflowName: f.workflowName,
      isActive: f.status === true,
      createdDate: new Date().toISOString(),
      workflowDetails: workflowDetails
    };

    if (this.isVendorOnboarding) {
      const selectedEntity = this.entitiesList.find(e => e.id === this.selectedEntityIdForWorkflow);
      payload.entity = selectedEntity ? [selectedEntity] : [];
    } else {
      payload.users = f.usersList || [];
    }

    this.loading = true;
    this.WorkflowServiceService.setUpWorkflow(payload).subscribe({
      next: () => {
        this.toastr.success('Workflow saved successfully!', '');
        this.loading = false;
        this.workflowsetupform.reset({ workflowName: '', documentType: '', status: false });
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
      next: (res: any) => {
        const master = Array.isArray(res) ? res[0] : res;
        this.workflowmasterId = master.workflowMasterId;

        // Patch common workflow fields
        this.workflowsetupform.patchValue({
          workflowName: master.workflowName,
          documentType: master.workflowTypeId,
          status: master.isActive
        });

        // Detect Vendor Onboarding workflow
        const isVendorType = master.workflowDetails?.[0]?.workflowType === 'Vendor Company Onboarding';
        this.isVendorOnboarding = isVendorType;

        if (isVendorType) {
          const selectedEntity = master.entity?.[0];
          if (selectedEntity) {
            // Fetch all available entities first
            this.companyService.getProCompanies().subscribe({
              next: (res: any) => {
                this.entitiesList = res?.result || [];

                // Try to find a match by id or name
                const matchedEntity =
                  this.entitiesList.find(
                    (e: any) => e.id === selectedEntity.id || e.name === selectedEntity.name
                  ) || null;

                if (matchedEntity) {
                  this.selectedEntityIdForWorkflow = matchedEntity.id;

                  // ✅ Patch matched entity so dropdown shows correct name
                  this.workflowsetupform.patchValue({
                    usersList: matchedEntity.id
                  });

                  // ✅ Load users for this entity
                  this.onEntitySelected(matchedEntity.id);
                } else {
                  console.warn('No matching entity found in company list for:', selectedEntity);
                }
              },
              error: (err) => console.error('Error fetching entities for vendor workflow:', err)
            });
          }
        } else {
          // Normal workflow path
          this.workflowsetupform.patchValue({
            usersList: master.users || []
          });
        }

        // Map workflow details (approvers)
        this.newApproverData = (master.workflowDetails || []).map((d: any) => ({
          approverName: d.approverName || '',
          approverList: d.userId,
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
          proxyApproverId: d.proxyApproverId,
          proxyApproverName: d.proxyApproverName,
          graceDays: d.graceDays
        }));

        this.newApproverData = [...this.newApproverData];
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

    // Map approvers -> workflowDetails
    const workflowDetails = this.newApproverData.map(a => ({
      WorkflowMasterId: this.workflowmasterId,
      workflowDetailsId: a.workflowDetailsId,
      approverList: a.approverList || '',
      userId: a.approverList || '',
      amountFrom: Number(a.amountFrom) || 0,
      amountTo: Number(a.amountTo) || 0,
      approverLevel: Number(a.approverLevel) || 0,
      canApprove: !!a.canApprove,
      canReject: !!a.canReject,
      canSendBack: !!a.canSendBack,
      canSubmit: !!a.canSubmit,
      isApprovalCompulsory: !!a.isApprovalCompulsory,
      proxyApproverId: a.proxyApproverId || '',
      graceDays: Number(a.graceDays) || 0
    }));

    // Build payload base
    const payload: any = {
      workflowMasterId: this.workflowmasterId,
      workflowTypeId: f.documentType,
      workflowName: f.workflowName,
      isActive: f.status === true,
      createdDate: new Date().toISOString(),
      workflowDetails: workflowDetails,
    };

    // Add entity or users based on onboarding flag (just like submitForm)
    if (this.isVendorOnboarding) {
      const selectedEntity = this.entitiesList.find(e => e.id === this.selectedEntityIdForWorkflow);
      payload.entity = selectedEntity ? [selectedEntity] : [];
    } else {
      payload.users = f.usersList || [];
    }

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