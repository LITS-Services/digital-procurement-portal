import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { PermissionService } from 'app/shared/permissions/permission.service';
import { SystemService } from 'app/shared/services/system.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-integration-manager-list',
  templateUrl: './integration-manager-list.component.html',
  styleUrls: ['./integration-manager-list.component.scss'],
  standalone: false
})
export class IntegrationManagerListComponent implements OnInit {
  FORM_IDS = FORM_IDS;
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  rows: any[] = [];
  chkBoxSelected: any[] = [];
  columns = [
    { prop: 'name', name: 'Name' },
    { prop: 'code', name: 'Code' },
    { prop: 'url', name: 'Endpoint URL' },
    { prop: 'intervalType', name: 'Interval Type' },
    { prop: 'interval', name: 'Interval' }
  ];

  loading = false;
  totalItems = 0;
  currentPage = 1;
  pageSize = 10;

  integrationId: number | null = null;
  isEditButtonDisabled = true;
  isDeleteButtonDisabled = true;
  isAllSelected = false;
  datatableVisible = true;

  constructor(
    private router: Router,
    private systemService: SystemService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    this.enableDisableButtons();
    this.loadIntegrations();
  }

  get isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  onAutoResize(): void {
    this.datatableVisible = false;
    this.cdr.detectChanges();
    requestAnimationFrame(() => {
      this.datatableVisible = true;
      this.cdr.detectChanges();
    });
  }

  loadIntegrations(): void {
    this.loading = true;
    this.systemService.getAllIntegrationManagers(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        this.rows = res?.result || res?.items || [];
        this.totalItems = res?.totalItems || this.rows.length;
        this.loading = false;
        this.chkBoxSelected = [];
        this.integrationId = null;
        this.enableDisableButtons();
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Failed to load integrations.');
      }
    });
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'chip chip--success' : 'chip chip--rejected';
  }

  onCreate(): void {
    if (!this.permissionService.can(FORM_IDS.INTEGRATION_MANAGER, 'write')) {
      return;
    }
    this.router.navigate(['/setup/integration-manager/form']);
  }

  onEdit(): void {
    if (!this.permissionService.can(FORM_IDS.INTEGRATION_MANAGER, 'write')) {
      return;
    }
    if (this.chkBoxSelected.length !== 1 || !this.integrationId) {
      this.toastr.info('Please select one record to update.');
      return;
    }

    this.router.navigate(['/setup/integration-manager/form'], { queryParams: { id: this.integrationId } });
  }

  onDelete(): void {
    if (!this.permissionService.can(FORM_IDS.INTEGRATION_MANAGER, 'delete')) {
      return;
    }
    if (this.chkBoxSelected.length !== 1 || !this.integrationId) {
      this.toastr.info('Please select one record to delete.');
      return;
    }

    Swal.fire({
      title: 'Delete Integration',
      text: 'This record will be removed permanently.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it'
    }).then((result) => {
      if (!result.isConfirmed || !this.integrationId) {
        return;
      }

      const modifiedBy = localStorage.getItem('userEmail') || localStorage.getItem('userName') || 'system';
      this.systemService.deleteIntegrationManager(this.integrationId, modifiedBy).subscribe({
        next: () => {
          Swal.fire('Deleted!', 'Integration deleted successfully.', 'success');
          this.loadIntegrations();
        },
        error: () => {
          this.toastr.error('Failed to delete integration.');
        }
      });
    });
  }

  customChkboxOnSelect({ selected }): void {
    this.chkBoxSelected = [...selected];
    this.integrationId = selected?.[0]?.id ?? null;
    this.enableDisableButtons();
  }

  toggleSelectAll(event: any): void {
    this.chkBoxSelected = event.target.checked ? [...this.rows] : [];
    this.integrationId = this.chkBoxSelected?.[0]?.id ?? null;
    this.enableDisableButtons();
  }

  enableDisableButtons(): void {
    const selectedCount = this.chkBoxSelected.length;
    this.isEditButtonDisabled = selectedCount !== 1;
    this.isDeleteButtonDisabled = selectedCount !== 1;
    this.isAllSelected = this.rows.length > 0 && selectedCount === this.rows.length;
  }

  onPageChange(event: any): void {
    this.currentPage = (event?.offset ?? 0) + 1;
    this.loadIntegrations();
  }

  onSort(event): void {
    const sort = event?.sorts?.[0];
    if (!sort?.prop) {
      return;
    }
    this.rows = [...this.rows].sort((a, b) => {
      const aValue = (a?.[sort.prop] ?? '').toString();
      const bValue = (b?.[sort.prop] ?? '').toString();
      return aValue.localeCompare(bValue) * (sort.dir === 'desc' ? -1 : 1);
    });
  }

  homePage(): void {
    this.router.navigate(['/dashboard/dashboard1']);
  }
}
