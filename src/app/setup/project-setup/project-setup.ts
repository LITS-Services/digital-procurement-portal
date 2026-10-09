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
    this.projectService.getAll(this.currentPage, this.pageSize).subscribe((res: any) => {
      this.projects = res.result || [];
      this.totalItems = res.totalItems || 0;
      this.selected = [];
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
    this.departmentService.getAll(1, 1000).subscribe((res: any) => {
      this.departments = res.result || [];
    });
  }

  onSelect({ selected }: any) {
    this.selected = [...selected];
  }

  openModal(content: any) {
    this.isEdit = false;
    this.projectForm.reset({ id: 0 });
    this.activities.clear();
    this.modalService.open(content, { size: 'lg', centered: true });
  }

  editSelected(content: any) {
    if (this.selected.length === 1) {
      this.isEdit = true;
      const proj = this.selected[0];
      this.projectForm.patchValue(proj);
      
      this.activities.clear();
      if (proj.projectActivities && proj.projectActivities.length > 0) {
        proj.projectActivities.forEach((act: any) => {
          this.activities.push(this.fb.group({
            id: [act.id],
            name: [act.name, Validators.required],
            description: [act.description],
            budgetAmount: [act.budgetAmount, [Validators.required, Validators.min(0)]],
            allowedPercentage: [act.allowedPercentage, [Validators.required, Validators.min(0), Validators.max(100)]]
          }));
        });
      }

      this.modalService.open(content, { size: 'lg', centered: true });
    }
  }

  deleteSelected() {
    if (this.selected.length > 0) {
      if (confirm('Are you sure you want to delete the selected project?')) {
        this.projectService.delete(this.selected[0].id).subscribe(() => {
          this.loadProjects();
        });
      }
    }
  }

  save(modal: any) {
    if (this.projectForm.valid) {
      const payload = this.projectForm.value;
      const obs = this.isEdit ? this.projectService.update(payload) : this.projectService.create(payload);
      
      obs.subscribe(() => {
        modal.close();
        this.loadProjects();
      });
    }
  }
}
