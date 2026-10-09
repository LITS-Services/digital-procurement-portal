import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { DepartmentService } from '../../shared/services/department.service';

@Component({
  selector: 'app-department-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxDatatableModule, NgbModule, RouterModule],
  templateUrl: './department-setup.html',
  styleUrls: ['./department-setup.scss']
})
export class DepartmentSetup implements OnInit {
  departments: any[] = [];
  selected: any[] = [];
  SelectionType = SelectionType;
  departmentForm: FormGroup;
  isEdit = false;
  
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  constructor(
    private departmentService: DepartmentService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.departmentForm = this.fb.group({
      id: [0],
      name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments() {
    this.departmentService.getAll(this.currentPage, this.pageSize).subscribe((res: any) => {
      this.departments = res.result || [];
      this.totalItems = res.totalItems || 0;
      this.selected = [];
    });
  }

  onPageChange(event: any) {
    if (this.currentPage === event.offset + 1) {
      return;
    }
    this.currentPage = event.offset + 1;
    this.loadDepartments();
  }

  onSelect({ selected }: any) {
    this.selected = [...selected];
  }

  openModal(content: any) {
    this.isEdit = false;
    this.departmentForm.reset({ id: 0 });
    this.modalService.open(content, { centered: true });
  }

  editSelected(content: any) {
    if (this.selected.length === 1) {
      this.isEdit = true;
      const dept = this.selected[0];
      this.departmentForm.patchValue(dept);
      this.modalService.open(content, { centered: true });
    }
  }

  deleteSelected() {
    if (this.selected.length > 0) {
      if (confirm('Are you sure you want to delete the selected department?')) {
        this.departmentService.delete(this.selected[0].id).subscribe(() => {
          this.loadDepartments();
        });
      }
    }
  }

  save(modal: any) {
    if (this.departmentForm.valid) {
      const payload = this.departmentForm.value;
      const obs = this.isEdit ? this.departmentService.update(payload) : this.departmentService.create(payload);
      
      obs.subscribe(() => {
        modal.close();
        this.loadDepartments();
      });
    }
  }
}
