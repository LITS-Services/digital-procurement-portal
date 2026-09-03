import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { PermissionService } from 'app/shared/permissions/permission.service';
import { SuperAclService, SuperFormDto } from 'app/shared/services/super-acl.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-super-acl-setup',
  templateUrl: './super-acl-setup.component.html',
  styleUrls: ['./super-acl-setup.component.scss'],
  standalone: false
})
export class SuperAclSetupComponent implements OnInit {
  @ViewChild('datatable', { static: false }) datatable!: DatatableComponent;

  allForms: SuperFormDto[] = [];
  formList: SuperFormDto[] = [];
  search = '';
  statusFilter: '' | 'active' | 'inactive' = '';
  savingIds = new Set<number>();

  constructor(
    private router: Router,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private superAclService: SuperAclService,
    private permissionService: PermissionService
  ) {}

  get isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  ngOnInit(): void {
    this.fetchData();
  }

  homePage(): void {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  fetchData(): void {
    this.spinner.show();
    this.superAclService.getAllForms(1, 10000)
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: (res) => {
          const rows = res?.result ?? (res as any)?.Result ?? [];
          this.allForms = rows.map((row: any) => ({
            id: row.id ?? row.Id,
            name: row.name ?? row.Name,
            route: row.route ?? row.Route,
            isActive: !!(row.isActive ?? row.IsActive)
          }));
          this.applyFilters();
        },
        error: () => {
          this.toastr.error('Failed to load Super ACL forms.');
        }
      });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  setStatusFilter(value: '' | 'active' | 'inactive'): void {
    this.statusFilter = this.statusFilter === value ? '' : value;
    this.applyFilters();
  }

  applyFilters(): void {
    const term = this.search.trim().toLowerCase();
    this.formList = this.allForms.filter(row => {
      const matchesSearch = !term
        || (row.name || '').toLowerCase().includes(term)
        || (row.route || '').toLowerCase().includes(term);
      const matchesStatus =
        this.statusFilter === '' ||
        (this.statusFilter === 'active' && row.isActive) ||
        (this.statusFilter === 'inactive' && !row.isActive);
      return matchesSearch && matchesStatus;
    });
    this.cdr.detectChanges();
  }

  isSaving(row: SuperFormDto): boolean {
    return this.savingIds.has(row.id);
  }

  toggleActive(row: SuperFormDto): void {
    if (this.isSaving(row)) return;

    const previous = row.isActive;
    row.isActive = !row.isActive;
    this.formList = [...this.formList];
    this.savingIds.add(row.id);

    this.superAclService.updateFormActive(row.id, row.isActive).subscribe({
      next: (res) => {
        this.savingIds.delete(row.id);
        const failed = res && res.isSuccess === false;
        if (failed) {
          row.isActive = previous;
          this.formList = [...this.formList];
          return;
        }
        this.permissionService.refreshForCurrentUser$().subscribe();
        if (this.statusFilter) {
          this.applyFilters();
        }
      },
      error: () => {
        this.savingIds.delete(row.id);
        row.isActive = previous;
        this.formList = [...this.formList];
        this.toastr.error('Failed to update form status.');
      }
    });
  }
}
