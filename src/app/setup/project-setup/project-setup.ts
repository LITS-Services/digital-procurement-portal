import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, ViewChild, TemplateRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule, SelectionType, DatatableComponent } from '@swimlane/ngx-datatable';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ProjectService } from '../../shared/services/project.service';
import { DepartmentService } from '../../shared/services/department.service';
import { CompanyService } from '../../shared/services/Company.services';
import { NgSelectModule } from '@ng-select/ng-select';
import { DatatableAutoResizeDirective } from '../../shared/directives/dataTable-auto-resize.directive';

@Component({
  selector: 'app-project-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgxDatatableModule, NgbModule, RouterModule, NgSelectModule, DatatableAutoResizeDirective],
  templateUrl: './project-setup.html',
  styleUrls: ['./project-setup.scss']
})
export class ProjectSetup implements OnInit, OnDestroy {
  @ViewChild('datatable') datatable?: DatatableComponent;
  @ViewChild('logsModal') logsModal?: TemplateRef<any>;
  @ViewChild('assignUsersModal') assignUsersModal?: TemplateRef<any>;

  projects: any[] = [];
  departments: any[] = [];
  selected: any[] = [];
  SelectionType = SelectionType;
  projectForm: FormGroup;
  isEdit = false;
  saving = false;

  projectLogs: any[] = [];
  loadingLogs = false;
  currentProject: any = null;

  // Assign Users state
  assignModalRef?: NgbModalRef;
  currentAssignActivityIndex: number = 0;
  usersList: any[] = [];
  loadingUsers = false;
  userSearchTerm = '';
  activitySearchTerm = '';

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  constructor(
    private projectService: ProjectService,
    private departmentService: DepartmentService,
    private companyService: CompanyService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.projectForm = this.fb.group({
      id: [0],
      departmentId: [null, Validators.required],
      name: ['', Validators.required],
      description: [''],
      projectActivities: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadProjects();
    this.loadDepartments();
  }

  get activities(): FormArray {
    return this.projectForm.get('projectActivities') as FormArray;
  }

  addActivity() {
    this.activities.push(this.fb.group({
      id: [0],
      name: ['', Validators.required],
      description: [''],
      budgetAmount: [0, [Validators.required, Validators.min(0)]],
      allowedPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      assignedUserIds: [[]],
      userIds: [''],
      assignedUsers: [[]],
      isException: [false]
    }));
  }

  removeActivity(index: number) {
    this.activities.removeAt(index);
    if (this.currentAssignActivityIndex >= this.activities.length) {
      this.currentAssignActivityIndex = Math.max(0, this.activities.length - 1);
    }
  }

  onPercentageInput(event: any, index: number) {
    const input = event.target as HTMLInputElement;
    let val = parseFloat(input.value);
    if (isNaN(val)) return;
    if (val > 100) {
      val = 100;
      input.value = '100';
      this.activities.at(index).get('allowedPercentage')?.setValue(100);
    } else if (val < 0) {
      val = 0;
      input.value = '0';
      this.activities.at(index).get('allowedPercentage')?.setValue(0);
    }
  }

  onBudgetInput(event: any, index: number) {
    const input = event.target as HTMLInputElement;
    let val = parseFloat(input.value);
    if (isNaN(val)) return;
    if (val < 0) {
      val = 0;
      input.value = '0';
      this.activities.at(index).get('budgetAmount')?.setValue(0);
    }
  }

  loadProjects() {
    this.projectService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          this.projects = [...(res.result || [])];
          this.totalItems = res.totalItems || 0;
          this.selected = [];
          this.cdr.detectChanges();
          this.datatable?.recalculate();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.cdr.detectChanges();
        });
      }
    });
  }

  onPageChange(event: any) {
    if (this.currentPage === event.offset + 1) {
      return;
    }
    this.currentPage = event.offset + 1;
    this.loadProjects();
  }

  loadDepartments() {
    this.departmentService.getAll(1, 1000).subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          const list = res?.result ?? res?.$values ?? (Array.isArray(res) ? res : []);
          this.departments = [...list];
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.cdr.detectChanges();
        });
      }
    });
  }

  onSelect({ selected }: any) {
    this.selected = [...selected];
    this.cdr.detectChanges();
  }

  openModal(content: any) {
    this.isEdit = false;
    this.projectForm.reset({ id: 0, departmentId: null, name: '', description: '' });
    this.activities.clear();
    this.loadUsers();
    if (!this.departments || this.departments.length === 0) {
      this.loadDepartments();
    }
    this.modalService.open(content, {
      size: 'lg',
      centered: true,
      windowClass: 'cstm-setup-modal project-modal'
    });
  }

  private populateActivities(activitiesList: any[]) {
    this.activities.clear();
    if (activitiesList && activitiesList.length > 0) {
      activitiesList.forEach((act: any) => {
        let assignedUserIds: string[] = [];
        const rawUserIds = act.userIds ?? act.UserIds;
        if (typeof rawUserIds === 'string' && rawUserIds.trim()) {
          assignedUserIds = rawUserIds.split(',')
            .map((id: string) => id.trim())
            .filter((id: string) => !!id);
        } else if (Array.isArray(rawUserIds)) {
          assignedUserIds = rawUserIds.map((id: any) => String(id));
        } else if (Array.isArray(act.assignedUserIds)) {
          assignedUserIds = act.assignedUserIds.map((id: any) => String(id));
        } else if (Array.isArray(act.users) && act.users.length > 0) {
          assignedUserIds = act.users.map((u: any) => String(u.id || u.userId || u));
        } else if (Array.isArray(act.Users) && act.Users.length > 0) {
          assignedUserIds = act.Users.map((u: any) => String(u.id || u.userId || u));
        } else if (Array.isArray(act.assignedUsers)) {
          assignedUserIds = act.assignedUsers.map((u: any) => String(u.id || u.userId || u));
        }

        const returnedUsers = act.users || act.Users || act.assignedUsers || [];
        if (Array.isArray(returnedUsers) && returnedUsers.length > 0) {
          returnedUsers.forEach((u: any) => {
            const uId = String(u.id || u.userId || '');
            if (uId && !this.usersList.some(item => String(item.id) === uId)) {
              this.usersList.push({
                id: uId,
                userName: u.userName || u.username || '-',
                fullName: u.fullName || u.name || u.userName || '-',
                email: u.email || '-',
                role: u.roleName || u.role || '-'
              });
            }
          });
        }

        const rawExc = act.isException ?? act.IsException;
        const isException = rawExc === true || rawExc === 1 || rawExc === 'true' || rawExc === '1';

        this.activities.push(this.fb.group({
          id: [act.id ?? act.Id ?? 0],
          name: [act.name ?? act.Name ?? '', Validators.required],
          description: [act.description ?? act.Description ?? ''],
          budgetAmount: [act.budgetAmount ?? act.BudgetAmount ?? 0, [Validators.required, Validators.min(0)]],
          allowedPercentage: [act.allowedPercentage ?? act.AllowedPercentage ?? 0, [Validators.required, Validators.min(0), Validators.max(100)]],
          assignedUserIds: [assignedUserIds],
          userIds: [assignedUserIds.join(',')],
          assignedUsers: [returnedUsers],
          isException: [isException]
        }));
      });
    }
  }

  editSelected(content: any) {
    if (this.selected.length === 1) {
      this.isEdit = true;
      const proj = this.selected[0];
      this.projectForm.patchValue({
        id: proj.id,
        departmentId: proj.departmentId ?? null,
        name: proj.name,
        description: proj.description
      });
      
      this.populateActivities(proj.projectActivities || []);

      this.loadUsers();
      if (!this.departments || this.departments.length === 0) {
        this.loadDepartments();
      }

      if (proj.id) {
        this.projectService.getById(proj.id).subscribe({
          next: (res: any) => {
            this.ngZone.run(() => {
              const fullProj = res?.value ?? res?.result ?? res?.data ?? res;
              if (fullProj) {
                const deptId = fullProj.departmentId ?? fullProj.DepartmentId;
                if (deptId) {
                  this.projectForm.patchValue({ departmentId: deptId });
                }
                const name = fullProj.name ?? fullProj.Name;
                if (name) {
                  this.projectForm.patchValue({ name: name });
                }
                const desc = fullProj.description ?? fullProj.Description;
                if (desc !== undefined) {
                  this.projectForm.patchValue({ description: desc });
                }
                const acts = fullProj.projectActivities ?? fullProj.ProjectActivities;
                if (acts && Array.isArray(acts) && acts.length > 0) {
                  this.populateActivities(acts);
                }
              }
              this.cdr.detectChanges();
            });
          },
          error: (err) => {
            console.error('Error loading full project by ID:', err);
          }
        });
      }

      this.modalService.open(content, {
        size: 'lg',
        centered: true,
        windowClass: 'cstm-setup-modal project-modal'
      });
    }
  }

  deleteSelected() {
    if (this.selected.length > 0) {
      if (confirm('Are you sure you want to delete the selected project?')) {
        this.projectService.delete(this.selected[0].id).subscribe({
          next: () => {
            this.ngZone.run(() => {
              this.loadProjects();
              this.cdr.detectChanges();
            });
          },
          error: () => {
            this.ngZone.run(() => {
              this.cdr.detectChanges();
            });
          }
        });
      }
    }
  }

  save(modal: any) {
    if (this.projectForm.valid) {
      this.saving = true;
      const rawVal = this.projectForm.value;
      const payload = {
        ...rawVal,
        projectActivities: (rawVal.projectActivities || []).map((act: any) => {
          let userIdsArr: string[] = [];
          if (Array.isArray(act.assignedUserIds)) {
            userIdsArr = act.assignedUserIds.map((id: any) => String(id));
          } else if (Array.isArray(act.userIds)) {
            userIdsArr = act.userIds.map((id: any) => String(id));
          } else if (typeof act.userIds === 'string' && act.userIds.trim()) {
            userIdsArr = act.userIds.split(',').map((s: string) => s.trim()).filter((s: string) => !!s);
          }
          const userIdsStr = userIdsArr.join(',');
          const assignedUsers = this.usersList.filter(u => userIdsArr.includes(String(u.id)));
          const isException = !!act.isException;

          return {
            ...act,
            id: Number(act.id) || 0,
            name: act.name,
            description: act.description || '',
            budgetAmount: Number(act.budgetAmount) || 0,
            allowedPercentage: Number(act.allowedPercentage) || 0,
            userIds: userIdsStr,
            UserIds: userIdsStr,
            isException: isException,
            IsException: isException,
            assignedUserIds: userIdsArr,
            assignedUsers: assignedUsers
          };
        })
      };
      const obs = this.isEdit ? this.projectService.update(payload) : this.projectService.create(payload);

      obs.subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.saving = false;
            modal.close();
            this.loadProjects();
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.saving = false;
            this.cdr.detectChanges();
          });
        }
      });
    }
  }

  openAssignUsersModal(index: number, content: TemplateRef<any>) {
    this.currentAssignActivityIndex = index;
    this.userSearchTerm = '';
    this.activitySearchTerm = '';
    this.loadUsers();

    // Hide background project modal while Assign Users modal is active
    document.body.classList.add('assign-modal-open');

    this.assignModalRef = this.modalService.open(content, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
      windowClass: 'cstm-setup-modal assign-users-modal',
      backdropClass: 'assign-users-backdrop'
    });

    const cleanup = () => {
      document.body.classList.remove('assign-modal-open');
      this.cdr.detectChanges();
    };

    this.assignModalRef.result.then(cleanup, cleanup);
  }

  loadUsers(): void {
    if (this.usersList.length > 0) return;
    this.loadingUsers = true;
    const loggedInUserId = localStorage.getItem('userId');
    const entityId = Number(localStorage.getItem('selectedCompanyId')) || null;

    this.companyService.getProcurementUsers({
      userId: loggedInUserId,
      entityId: entityId
    }).subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          const raw = res?.result || res?.value || res?.$values || (Array.isArray(res) ? res : []);
          if (raw && raw.length > 0) {
            this.usersList = raw.map((u: any) => ({
              id: String(u.id || u.userId || u.guid || ''),
              userName: u.userName || u.username || u.name || '-',
              fullName: u.fullName || u.name || u.userName || '-',
              email: u.email || '-',
              role: u.roleName || u.role || u.userType || '-'
            }));
          } else {
            this.usersList = this.getFallbackUsers();
          }
          this.loadingUsers = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.ngZone.run(() => {
          this.loadingUsers = false;
          if (this.usersList.length === 0) {
            this.usersList = this.getFallbackUsers();
          }
          this.cdr.detectChanges();
        });
      }
    });
  }

  private getFallbackUsers(): any[] {
    return [
      { id: '1', userName: 'smansoori', fullName: 'Saeed Ahmed Al Mansoori', email: 'saeed.mansoori@company.ae', role: 'Project Manager' },
      { id: '2', userName: 'knuaimi', fullName: 'Khalid Rashid Al Nuaimi', email: 'khalid.nuaimi@company.ae', role: 'Procurement Specialist' },
      { id: '3', userName: 'mhashimi', fullName: 'Mohammed Al Hashimi', email: 'mohammed.hashimi@company.ae', role: 'Senior Buyer' },
      { id: '4', userName: 'fzahra', fullName: 'Fatima Al Zahra', email: 'fatima.zahra@company.ae', role: 'Finance Officer' },
      { id: '5', userName: 'aali', fullName: 'Ahmed Al Ali', email: 'ahmed.ali@company.ae', role: 'Operations Lead' },
      { id: '6', userName: 'azaabi', fullName: 'Abdullah Al Zaabi', email: 'abdullah.zaabi@company.ae', role: 'Approver' }
    ];
  }

  getCurrentActivityGroup(): FormGroup | null {
    if (this.currentAssignActivityIndex >= 0 && this.currentAssignActivityIndex < this.activities.length) {
      return this.activities.at(this.currentAssignActivityIndex) as FormGroup;
    }
    return null;
  }

  getCurrentActivityName(): string {
    const group = this.getCurrentActivityGroup();
    if (!group) return '';
    const name = group.get('name')?.value;
    return name && name.trim() ? name.trim() : `Activity ${this.currentAssignActivityIndex + 1}`;
  }

  getCurrentActivityBudget(): number {
    const group = this.getCurrentActivityGroup();
    return group ? (Number(group.get('budgetAmount')?.value) || 0) : 0;
  }

  getCurrentActivityAllowedPercentage(): number {
    const group = this.getCurrentActivityGroup();
    return group ? (Number(group.get('allowedPercentage')?.value) || 0) : 0;
  }

  isActivityException(index: number): boolean {
    if (index < 0 || index >= this.activities.length) return false;
    const val = this.activities.at(index).get('isException')?.value;
    return val === true || val === 1 || val === 'true' || val === '1';
  }

  toggleException(index: number): void {
    if (index < 0 || index >= this.activities.length) return;
    const isCurrentlyChecked = this.isActivityException(index);
    const newVal = !isCurrentlyChecked;

    this.activities.controls.forEach((ctrl, i) => {
      ctrl.get('isException')?.setValue(i === index ? newVal : false);
      ctrl.markAsDirty();
    });
    this.cdr.detectChanges();
  }

  getCurrentActivityAssignedUserIds(): string[] {
    const group = this.getCurrentActivityGroup();
    if (!group) return [];
    const val = group.get('assignedUserIds')?.value;
    return Array.isArray(val) ? val.map((v: any) => String(v)) : [];
  }

  isUserAssignedToCurrentActivity(userId: string): boolean {
    const assigned = this.getCurrentActivityAssignedUserIds();
    return assigned.includes(String(userId));
  }

  toggleUserAssignment(userId: string): void {
    const group = this.getCurrentActivityGroup();
    if (!group) return;
    const strId = String(userId);
    let assigned = [...this.getCurrentActivityAssignedUserIds()];
    const idx = assigned.indexOf(strId);
    if (idx > -1) {
      assigned.splice(idx, 1);
    } else {
      assigned.push(strId);
    }
    group.get('assignedUserIds')?.setValue(assigned);
    group.get('userIds')?.setValue(assigned);
    const assignedUsersObj = this.usersList.filter(u => assigned.includes(String(u.id)));
    group.get('assignedUsers')?.setValue(assignedUsersObj);
    group.markAsDirty();
    this.cdr.detectChanges();
  }

  isAllUsersSelectedForCurrentActivity(): boolean {
    const filtered = this.getFilteredUsers();
    if (filtered.length === 0) return false;
    const assigned = this.getCurrentActivityAssignedUserIds();
    return filtered.every(u => assigned.includes(String(u.id)));
  }

  toggleSelectAllUsers(): void {
    const group = this.getCurrentActivityGroup();
    if (!group) return;
    const filtered = this.getFilteredUsers();
    if (filtered.length === 0) return;

    const allSelected = this.isAllUsersSelectedForCurrentActivity();
    let assigned = [...this.getCurrentActivityAssignedUserIds()];

    if (allSelected) {
      const filteredIds = filtered.map(u => String(u.id));
      assigned = assigned.filter(id => !filteredIds.includes(id));
    } else {
      filtered.forEach(u => {
        const strId = String(u.id);
        if (!assigned.includes(strId)) {
          assigned.push(strId);
        }
      });
    }

    group.get('assignedUserIds')?.setValue(assigned);
    group.get('userIds')?.setValue(assigned);
    const assignedUsersObj = this.usersList.filter(u => assigned.includes(String(u.id)));
    group.get('assignedUsers')?.setValue(assignedUsersObj);
    group.markAsDirty();
    this.cdr.detectChanges();
  }

  selectActivityForAssignment(index: number): void {
    this.currentAssignActivityIndex = index;
    this.cdr.detectChanges();
  }

  getActivityAssignedUsersCount(index: number): number {
    return this.getActivityAssignedUserIds(index).length;
  }

  getActivityAssignedUserIds(index: number): string[] {
    if (index >= 0 && index < this.activities.length) {
      const group = this.activities.at(index) as FormGroup;
      const val = group?.get('assignedUserIds')?.value;
      return Array.isArray(val) ? val.map((v: any) => String(v)) : [];
    }
    return [];
  }

  getAssignedUserNamesTooltip(index: number): string {
    const userIds = this.getActivityAssignedUserIds(index);
    if (!userIds || userIds.length === 0) {
      return 'No users assigned. Click to assign.';
    }
    const group = this.activities.at(index) as FormGroup;
    const assignedUsersObj: any[] = group?.get('assignedUsers')?.value || [];

    const names: string[] = [];
    userIds.forEach(id => {
      const u = this.usersList.find(x => String(x.id) === String(id)) ||
                assignedUsersObj.find(x => String(x.id || x.userId) === String(id));
      if (u) {
        names.push(u.fullName || u.userName || id);
      }
    });

    if (names.length > 0) {
      return names.join(', ');
    }
    return `${userIds.length} user(s) assigned. Click to view.`;
  }

  getFilteredUsers(): any[] {
    if (!this.userSearchTerm || !this.userSearchTerm.trim()) {
      return this.usersList;
    }
    const term = this.userSearchTerm.toLowerCase().trim();
    return this.usersList.filter(u =>
      (u.fullName && u.fullName.toLowerCase().includes(term)) ||
      (u.userName && u.userName.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.role && u.role.toLowerCase().includes(term))
    );
  }

  getFilteredActivities(): { index: number; group: FormGroup }[] {
    const result: { index: number; group: FormGroup }[] = [];
    this.activities.controls.forEach((ctrl, i) => {
      const group = ctrl as FormGroup;
      const name = group.get('name')?.value || '';
      if (!this.activitySearchTerm || !this.activitySearchTerm.trim() || name.toLowerCase().includes(this.activitySearchTerm.toLowerCase().trim())) {
        result.push({ index: i, group });
      }
    });
    return result;
  }

  getUserInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  viewLogs(project: any) {
    console.log('viewLogs called for project:', project);
    this.currentProject = project;
    this.loadingLogs = true;
    this.projectLogs = [];
    this.projectService.getLogs(project.id).subscribe({
      next: (res: any) => {
        console.log('API response:', res);
        this.ngZone.run(() => {
          // Handle both array response and wrapped response
          this.projectLogs = Array.isArray(res) ? res : (res.value || res.result || []);
          console.log('projectLogs set to:', this.projectLogs);
          this.loadingLogs = false;
          this.openLogsModal();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Error fetching logs:', err);
        this.ngZone.run(() => {
          this.loadingLogs = false;
          this.projectLogs = [];
          this.openLogsModal();
          this.cdr.detectChanges();
        });
      }
    });
  }

  parseJsonValues(json: string | null | undefined): { key: string; value: string }[] {
    if (!json) return [];
    try {
      const obj = JSON.parse(json);
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return [];
      return Object.entries(obj).map(([key, value]) => ({
        key: this.formatKey(key),
        value: value === null || value === undefined ? '—' : String(value)
      }));
    } catch {
      return [{ key: 'Value', value: json }];
    }
  }

  formatKey(key: string): string {
    // Convert camelCase / PascalCase to "Title Case With Spaces"
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase())
      .trim();
  }

  getLogUserName(log: any): string {
    // Check for username in various possible fields
    if (log.createdByUserName || log.CreatedByUserName) {
      return log.createdByUserName || log.CreatedByUserName;
    }
    if (log.userName || log.UserName) {
      return log.userName || log.UserName;
    }
    if (log.username || log.Username) {
      return log.username || log.Username;
    }
    if (log.user?.userName || log.user?.UserName) {
      return log.user?.userName || log.user?.UserName;
    }
    if (log.user?.username || log.user?.Username) {
      return log.user?.username || log.user?.Username;
    }
    if (log.user?.fullName || log.user?.FullName) {
      return log.user?.fullName || log.user?.FullName;
    }
    // Fallback to createdBy if no username found
    return log.createdBy || log.CreatedBy || 'System';
  }

  openLogsModal() {
    console.log('openLogsModal called, logsModal:', this.logsModal);
    console.log('projectLogs length:', this.projectLogs.length);
    console.log('loadingLogs:', this.loadingLogs);
    const modalRef = this.modalService.open(this.logsModal, {
      size: 'xl',
      centered: true,
      windowClass: 'cstm-setup-modal logs-modal'
    });
    console.log('Modal opened:', modalRef);
  }

  ngOnDestroy(): void {
    document.body.classList.remove('assign-modal-open');
    this.panelPositionObserver?.disconnect();
    this.panelResizeObserver?.disconnect();
  }

  private currentlyOpenSelect: any = null;
  private panelPositionObserver?: MutationObserver;
  private panelResizeObserver?: ResizeObserver;

  @HostListener('document:mousedown', ['$event'])
  onDocumentMousedown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    if (target.closest('.ng-dropdown-panel')) {
      return;
    }

    const clickedSelect = target.closest('ng-select');

    if (this.currentlyOpenSelect) {
      const currentHost = this.currentlyOpenSelect?.element || (this.currentlyOpenSelect as any)?._elementRef?.nativeElement;
      if (!clickedSelect || (currentHost && clickedSelect !== currentHost)) {
        try {
          this.currentlyOpenSelect.close();
          if (typeof this.currentlyOpenSelect.detectChanges === 'function') {
            this.currentlyOpenSelect.detectChanges();
          }
        } catch (e) {}
        this.currentlyOpenSelect = null;
      }
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.currentlyOpenSelect) {
      this.adjustDropdownPosition(this.currentlyOpenSelect);
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.currentlyOpenSelect) {
      this.adjustDropdownPosition(this.currentlyOpenSelect);
    }
  }

  private adjustDropdownPosition(selectInstance?: any): void {
    const select = selectInstance || this.currentlyOpenSelect;
    if (!select) return;

    const host = select.element || (select as any)?._elementRef?.nativeElement;
    if (!host) return;

    const panels = document.querySelectorAll('.ng-dropdown-panel');
    if (!panels.length) return;
    const panel = panels[panels.length - 1] as HTMLElement;
    if (!panel) return;

    const selectRect = host.getBoundingClientRect();
    const panelHeight = panel.offsetHeight;
    if (!panelHeight) return;

    const isTop = panel.classList.contains('ng-select-top');

    if (isTop) {
      panel.style.position = 'fixed';
      panel.style.top = `${Math.max(10, selectRect.top - panelHeight - 2)}px`;
      panel.style.bottom = 'auto';
      panel.style.left = `${selectRect.left}px`;
      panel.style.width = `${selectRect.width}px`;
    } else if (panel.classList.contains('ng-select-bottom')) {
      panel.style.position = 'fixed';
      panel.style.top = `${selectRect.bottom + 2}px`;
      panel.style.bottom = 'auto';
      panel.style.left = `${selectRect.left}px`;
      panel.style.width = `${selectRect.width}px`;
    }
  }

  private observePanel(panel: HTMLElement, selectInstance: any): void {
    if (this.panelPositionObserver) {
      this.panelPositionObserver.disconnect();
    }
    if (this.panelResizeObserver) {
      this.panelResizeObserver.disconnect();
    }

    this.panelPositionObserver = new MutationObserver(() => {
      if (panel.classList.contains('ng-select-top') && panel.style.bottom !== 'auto') {
        this.adjustDropdownPosition(selectInstance);
      }
    });

    this.panelPositionObserver.observe(panel, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    if (typeof ResizeObserver !== 'undefined') {
      this.panelResizeObserver = new ResizeObserver(() => {
        this.adjustDropdownPosition(selectInstance);
      });
      this.panelResizeObserver.observe(panel);
    }
  }

  onDropdownOpen(openedSelect?: any): void {
    if (this.currentlyOpenSelect && this.currentlyOpenSelect !== openedSelect) {
      try {
        this.currentlyOpenSelect.close();
        if (typeof this.currentlyOpenSelect.detectChanges === 'function') {
          this.currentlyOpenSelect.detectChanges();
        }
      } catch (e) {}
    }
    this.currentlyOpenSelect = openedSelect;

    setTimeout(() => {
      const panels = document.querySelectorAll('.ng-dropdown-panel');
      if (panels.length) {
        const lastPanel = panels[panels.length - 1] as HTMLElement;
        this.observePanel(lastPanel, openedSelect);
        this.adjustDropdownPosition(openedSelect);

        const input = lastPanel.querySelector('.dropdown-search-input') as HTMLInputElement;
        if (input) {
          input.value = '';
          input.focus();
        }
      }
    }, 0);

    setTimeout(() => {
      this.adjustDropdownPosition(openedSelect);
    }, 40);

    setTimeout(() => {
      this.adjustDropdownPosition(openedSelect);
    }, 120);
  }

  onDropdownClose(select: any): void {
    if (this.panelPositionObserver) {
      this.panelPositionObserver.disconnect();
      this.panelPositionObserver = undefined;
    }
    if (this.panelResizeObserver) {
      this.panelResizeObserver.disconnect();
      this.panelResizeObserver = undefined;
    }
    if (this.currentlyOpenSelect === select) {
      this.currentlyOpenSelect = null;
    }
  }
}
