import { Component, OnInit, ChangeDetectorRef, NgZone, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule, SelectionType, DatatableComponent } from '@swimlane/ngx-datatable';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { DepartmentService } from '../../shared/services/department.service';
import { DatatableAutoResizeDirective } from '../../shared/directives/dataTable-auto-resize.directive';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-department-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxDatatableModule, NgbModule, RouterModule, DatatableAutoResizeDirective, TranslateModule],
  templateUrl: './department-setup.html',
  styleUrls: ['./department-setup.scss']
})
export class DepartmentSetup implements OnInit {
  @ViewChild('datatable') datatable?: DatatableComponent;

  departments: any[] = [];
  selected: any[] = [];
  SelectionType = SelectionType;
  departmentForm: FormGroup;
  isEdit = false;
  saving = false;
  
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  constructor(
    private departmentService: DepartmentService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
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
    this.departmentService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          this.departments = [...(res.result || [])];
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
    this.loadDepartments();
  }

  onSelect({ selected }: any) {
    this.selected = [...selected];
    this.cdr.detectChanges();
  }

  openModal(content: any) {
    this.isEdit = false;
    this.departmentForm.reset({ id: 0 });
    this.modalService.open(content, {
      centered: true,
      size: 'md',
      windowClass: 'cstm-setup-modal dept-modal'
    });
  }

  editSelected(content: any) {
    if (this.selected.length === 1) {
      this.isEdit = true;
      const dept = this.selected[0];
      this.departmentForm.patchValue(dept);
      this.modalService.open(content, {
        centered: true,
        size: 'md',
        windowClass: 'cstm-setup-modal dept-modal'
      });
    }
  }

  deleteSelected() {
    if (this.selected.length > 0) {
      if (confirm('Are you sure you want to delete the selected department?')) {
        this.departmentService.delete(this.selected[0].id).subscribe({
          next: () => {
            this.ngZone.run(() => {
              this.loadDepartments();
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
    if (this.departmentForm.valid) {
      this.saving = true;
      const payload = this.departmentForm.value;
      const obs = this.isEdit ? this.departmentService.update(payload) : this.departmentService.create(payload);
      
      obs.subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.saving = false;
            modal.close();
            this.loadDepartments();
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
