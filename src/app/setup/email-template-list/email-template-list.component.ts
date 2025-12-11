import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { EmailTemplateService } from 'app/shared/services/EmailTemplateService';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { PermissionService } from 'app/shared/permissions/permission.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-email-template-list',
  templateUrl: './email-template-list.component.html',
  styleUrls: ['./email-template-list.component.scss'],
  standalone: false
})
export class EmailTemplateListComponent implements OnInit {
  FORM_IDS = FORM_IDS;
  @ViewChild('confirmDeleteModal') confirmDeleteModal: TemplateRef<any>;

  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  public chkBoxSelected = [];
  loading = false;
  public rows = [];
  public allEmailTemplates = [];
  columns = [];
  templateId: number;
  isEditButtonDisabled = true;
  isDeleteButtonDisabled = true;
  isOpenButtonDisabled = true;
  isAllSelected = false;

  constructor(
    private router: Router,
    private emailTemplateService: EmailTemplateService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    this.getAllEmailTemplates();

    // Table Columns
    this.columns = [
      { prop: 'subject', name: 'Subject' },
      { prop: 'body', name: 'Body' },
      { prop: 'workFlowType', name: 'Type' },
      { prop: 'procurementCompany', name: 'Entity' }
    ];
  }

  // Fetch all email templates
  getAllEmailTemplates() {
    this.loading = true;

    this.emailTemplateService.getAllEmailTemplates().subscribe({
      next: (res: any) => {
        this.allEmailTemplates = res.result.map(item => ({
          id: item.id,
          subject: this.truncateText(item.subject, 50),
          body: this.truncateText(item.body.replace(/<[^>]+>/g, ''), 50),
          workFlowType: item.workFlowType,
          procurementCompany: item.procurementCompany,
        }));

        this.rows = [...this.allEmailTemplates];

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching email templates:', err);
        this.toastr.error('Failed to load email templates', 'Error');
        this.loading = false;
      }
    });
  }

  confirmDelete() {
    if (!this.permissionService.can(FORM_IDS.EMAIL_TEMPLATE_LIST, 'delete'))
      return;

    if (!this.templateId) return;

    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this email template?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteTemplate();
      }
    });
  }

  deleteTemplate() {
    this.loading = true;

    this.emailTemplateService.deleteEmailTemplate({
      id: this.templateId
    }).subscribe({
      next: () => {
        Swal.fire(
          'Deleted!',
          'Template has been deleted successfully.',
          'success'
        );

        this.getAllEmailTemplates();
        this.chkBoxSelected = [];
        this.templateId = null;
        this.enableDisableButtons();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error deleting template:', err);

        Swal.fire(
          'Error',
          'Failed to delete template.',
          'error'
        );

        this.loading = false;
      }
    });
  }

  // Navigate to edit page
  editTemplate() {
    if (!this.permissionService.can(FORM_IDS.EMAIL_TEMPLATE_LIST, 'write'))
      return;
    if (!this.templateId) return;
    this.router.navigate(['/setup/create-email-template'], { queryParams: { id: this.templateId } });
  }

  // Truncate long text for table display
  truncateText(text: string, limit: number = 50): string {
    if (!text) return '(...)';
    const truncated = text.length > limit ? text.substring(0, limit) + '...' : text;
    return `(${truncated})`;
  }

  // Sorting
  onSort(event) {
    this.loading = true;
    setTimeout(() => {
      const rows = [...this.rows];
      const sort = event.sorts[0];
      rows.sort((a, b) =>
        a[sort.prop].localeCompare(b[sort.prop]) * (sort.dir === 'desc' ? -1 : 1)
      );
      this.rows = rows;
      this.loading = false;
    }, 500);
  }

  // Checkbox selection
  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [];
    this.chkBoxSelected.push(...selected);
    this.templateId = selected[0]?.id;
    this.enableDisableButtons();
  }

  enableDisableButtons() {
    const selectedRowCount = this.chkBoxSelected.length;
    this.isDeleteButtonDisabled = selectedRowCount !== 1;
    this.isEditButtonDisabled = selectedRowCount !== 1;
    this.isOpenButtonDisabled = selectedRowCount === 0;
    this.isAllSelected = this.rows.length === selectedRowCount;
  }

  toggleSelectAll(event) {
    if (event.target.checked) {
      this.chkBoxSelected = [...this.rows];
    } else {
      this.chkBoxSelected = [];
    }
    this.enableDisableButtons();
  }

  // Navigation
  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  createTemplate() {
    if (!this.permissionService.can(FORM_IDS.EMAIL_TEMPLATE_LIST, 'write'))
      return;
    this.router.navigate(['/setup/create-email-template']);
  }
}