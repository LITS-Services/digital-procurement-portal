import { Component, OnInit, ChangeDetectorRef, NgZone, ViewChild } from '@angular/core';
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
export class ProjectSetup implements OnInit {
  @ViewChild('datatable') datatable?: DatatableComponent;

  projects: any[] = [];
  departments: any[] = [];
  selected: any[] = [];
  SelectionType = SelectionType;
  projectForm: FormGroup;
  isEdit = false;
  saving = false;

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
          this.departments = [...(res.result || [])];
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
}
