import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'app/shared/auth/auth.service';
import { EmailTemplateService } from 'app/shared/services/EmailTemplateService'; 
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { PermissionService } from 'app/shared/permissions/permission.service';

@Component({
  selector: 'app-email-template-list',
  templateUrl: './email-template-list.component.html',
  styleUrls: ['./email-template-list.component.scss']
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
    private modalService: NgbModal,
    private authService: AuthService,
    private emailTemplateService: EmailTemplateService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    this.getEmailTemplates();

    // Table Columns
    this.columns = [
      { prop: 'subject', name: 'Subject' },
      { prop: 'body', name: 'Body' },
      { prop: 'type', name: 'Type' },
      { prop: 'entity', name: 'Entity' }
    ];
  }

  // Fetch all email templates
  getEmailTemplates() {
    this.loading = true;

    this.emailTemplateService.getEmailTemplate().subscribe({
      next: (res: any) => {
        this.allEmailTemplates = res.result.map(item => ({
          id: item.id,
          subject: this.truncateText(item.subject, 50),
          body: this.truncateText(item.body.replace(/<[^>]+>/g, ''), 50),
          type: item.type,
          entity: item.entity
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

  // Open confirmation modal for delete
  confirmDelete() {
    if(!this.permissionService.can(FORM_IDS.EMAIL_TEMPLATE_LIST, 'delete'))
      return;
    if (!this.templateId) return;
    this.modalService.open(this.confirmDeleteModal, { centered: true });
  }

  // Delete template after confirmation
  deleteTemplateConfirmed() {
    const username = localStorage.getItem('userName') || 'Unknown User';
    this.loading = true;

    this.emailTemplateService.deleteEmailTemplate(
      `${this.templateId}?modifiedBy=${encodeURIComponent(username)}`
    ).subscribe({
      next: () => {
        this.toastr.success('Template deleted successfully!', 'Success');
        this.getEmailTemplates();
        this.chkBoxSelected = [];
        this.templateId = null;
        this.enableDisableButtons();
        this.loading = false;
        this.modalService.dismissAll();
      },
      error: (err) => {
        console.error('Error deleting template:', err);
        this.toastr.error('Failed to delete template', 'Error');
        this.loading = false;
        this.modalService.dismissAll();
      }
    });
  }

  // Navigate to edit page
  editTemplate() {
    if(!this.permissionService.can(FORM_IDS.EMAIL_TEMPLATE_LIST, 'write'))
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
    if(!this.permissionService.can(FORM_IDS.EMAIL_TEMPLATE_LIST, 'write'))
      return;
    this.router.navigate(['/setup/create-email-template']);
  }
}
