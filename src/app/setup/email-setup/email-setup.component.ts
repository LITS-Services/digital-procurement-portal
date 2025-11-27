import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { PermissionService } from 'app/shared/permissions/permission.service';
import { EmailTemplateService } from 'app/shared/services/EmailTemplateService';

@Component({
  selector: 'app-email-setup',
  templateUrl: './email-setup.component.html',
  styleUrls: ['./email-setup.component.scss']
})
export class EmailSetupComponent implements OnInit {
  FORM_IDS = FORM_IDS;
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  public chkBoxSelected = [];
  loading = false;
  public rows = [];
  public allEmailLogs = [];
  columns = [];
  announcementId: number;
  isEditButtonDisabled = true;
  isDeleteButtonDisabled = true;
  isOpenButtonDisabled = true;
  isResendButtonDisabled = true; // ✅ New button disable state
  isAllSelected = false;

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private EmailTemplateService: EmailTemplateService,
    private cdr: ChangeDetectorRef,
    private permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    this.getEmailLogs();

    this.columns = [
      { prop: 'receiverEmail', name: 'Receiver Email' },
      { prop: 'requestStatusName', name: 'Request Status' },
      { prop: 'subject', name: 'Subject' },
      { prop: 'body', name: 'Body' }
    ];
  }

  getEmailLogs() {
    this.loading = true;

    this.EmailTemplateService.getUserInvitation().subscribe({
      next: (res: any[]) => {
        this.allEmailLogs = res.map(item => ({
          id: item.id,
          receiverEmail: item.receiverEmail,
          requestStatusName: item.requestStatusName,
          subject: this.truncateText(item.subject),
          body: this.truncateText(item.body)
        }));

        this.rows = [...this.allEmailLogs];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching email logs:', err);
        this.loading = false;
      }
    });
  }

  showAll() {
    this.rows = [...this.allEmailLogs];
  }

  showInProcess() {
    this.rows = this.allEmailLogs.filter(log =>
      log.requestStatusName?.toLowerCase() === 'send'
    );
  }

  showRecall() {
    this.rows = this.allEmailLogs.filter(log =>
      log.requestStatusName?.toLowerCase() === 'resend' ||
      log.requestStatusName?.toLowerCase() === 'sendback'
    );
  }

  truncateText(text: string, limit: number = 50): string {
    return text && text.length > limit ? text.substring(0, limit) + '...' : text;
  }

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
    }, 1000);
  }

  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [...selected];
    this.announcementId = selected[0]?.id;
    this.enableDisableButtons();
  }

  enableDisableButtons() {
    const selectedRowCount = this.chkBoxSelected.length;
    this.isDeleteButtonDisabled = selectedRowCount === 0;
    this.isEditButtonDisabled = selectedRowCount !== 1;
    this.isOpenButtonDisabled = selectedRowCount === 0;
    this.isResendButtonDisabled = selectedRowCount !== 1; // ✅ Only one selection allows resend
    this.isAllSelected = this.rows.length === selectedRowCount;
  }

  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  CreatInvitations() {
    if(!this.permissionService.can(FORM_IDS.INVITATION, 'write'))
      return;
    this.router.navigate(['/setup/create-invitation']);
  }

  // ✅ NEW: Resend button logic
  resendInvitation() {
    if (this.announcementId) {
      this.router.navigate(['/setup/create-invitation'], {
        queryParams: { id: this.announcementId, mode: 'resend' }
      });
    }
  }
}
