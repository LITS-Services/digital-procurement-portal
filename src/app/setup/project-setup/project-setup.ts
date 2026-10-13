import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, ViewChild, TemplateRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule, SelectionType, DatatableComponent } from '@swimlane/ngx-datatable';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ProjectService } from '../../shared/services/project.service';
import { DepartmentService } from '../../shared/services/department.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { DatatableAutoResizeDirective } from '../../shared/directives/dataTable-auto-resize.directive';

@Component({
  selector: 'app-project-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxDatatableModule, NgbModule, RouterModule, NgSelectModule, DatatableAutoResizeDirective],
  templateUrl: './project-setup.html',
  styleUrls: ['./project-setup.scss']
})
export class ProjectSetup implements OnInit, OnDestroy {
  @ViewChild('datatable') datatable?: DatatableComponent;
  @ViewChild('logsModal') logsModal?: TemplateRef<any>;

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

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  constructor(
    private projectService: ProjectService,
    private departmentService: DepartmentService,
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
      allowedPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
    }));
  }

  removeActivity(index: number) {
    this.activities.removeAt(index);
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
        this.activities.push(this.fb.group({
          id: [act.id || 0],
          name: [act.name, Validators.required],
          description: [act.description || ''],
          budgetAmount: [act.budgetAmount ?? 0, [Validators.required, Validators.min(0)]],
          allowedPercentage: [act.allowedPercentage ?? 0, [Validators.required, Validators.min(0), Validators.max(100)]]
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

      if (!this.departments || this.departments.length === 0) {
        this.loadDepartments();
      }

      if (proj.id && (!proj.projectActivities || proj.projectActivities.length === 0)) {
        this.projectService.getById(proj.id).subscribe({
          next: (res: any) => {
            const fullProj = res?.result;
            if (fullProj) {
              if (fullProj.departmentId && !this.projectForm.get('departmentId')?.value) {
                this.projectForm.patchValue({ departmentId: fullProj.departmentId });
              }
              if (fullProj.projectActivities && fullProj.projectActivities.length > 0 && this.activities.length === 0) {
                this.populateActivities(fullProj.projectActivities);
              }
            }
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
      const payload = this.projectForm.value;
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

  openLogsModal() {
    console.log('openLogsModal called, logsModal:', this.logsModal);
    console.log('projectLogs length:', this.projectLogs.length);
    console.log('loadingLogs:', this.loadingLogs);
    const modalRef = this.modalService.open(this.logsModal, {
      size: 'lg',
      centered: true,
      windowClass: 'cstm-setup-modal logs-modal'
    });
    console.log('Modal opened:', modalRef);
  }

  ngOnDestroy(): void {
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
