import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ProjectService } from '../../shared/services/project.service';
import { DepartmentService } from '../../shared/services/department.service';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-project-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxDatatableModule, NgbModule, RouterModule, NgSelectModule],
  templateUrl: './project-setup.html',
  styleUrls: ['./project-setup.scss']
})
export class ProjectSetup implements OnInit {
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
    private toastr: ToastrService
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

  loadProjects() {
    this.projectService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res: any) => {
        this.projects = res.result || [];
        this.totalItems = res.totalItems || 0;
        this.selected = [];
      },
      error: () => {
        this.toastr.error('Failed to load projects.');
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
        this.departments = res.result || [];
      },
      error: () => {
        this.toastr.error('Failed to load departments.');
      }
    });
  }

  onSelect({ selected }: any) {
    this.selected = [...selected];
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
            this.toastr.success('Project deleted successfully!');
            this.loadProjects();
          },
          error: (err: any) => {
            this.toastr.error(err?.error?.message || 'Failed to delete project.');
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
          this.saving = false;
          this.toastr.success(`Project ${this.isEdit ? 'updated' : 'created'} successfully!`);
          modal.close();
          this.loadProjects();
        },
        error: (err: any) => {
          this.saving = false;
          this.toastr.error(err?.error?.message || `Failed to ${this.isEdit ? 'update' : 'create'} project.`);
        }
      });
    }
  }
}
