import { ChangeDetectorRef, Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { PermissionService } from 'app/shared/permissions/permission.service';
import { EmailTemplateService } from 'app/shared/services/EmailTemplateService';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

declare var tinymce: any;

@Component({
  selector: 'app-email-setup',
  templateUrl: './email-setup.component.html',
  styleUrls: ['./email-setup.component.scss'],
  standalone: false
})
export class EmailSetupComponent implements OnInit, OnDestroy {
  FORM_IDS = FORM_IDS;
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  @ViewChild('datatable', { static: false }) datatable!: DatatableComponent;
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
  invitationForm: FormGroup;
  submitted = false;
  senderName: string = '';

  datatableVisible: boolean = true;
  modalTitle: string = 'Send Invitation';
  modalButtonText: string = 'Send Invite';
  requestStatus: string = 'Send';
  isSending: boolean = false;

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private EmailTemplateService: EmailTemplateService,
    private cdr: ChangeDetectorRef,
    private permissionService: PermissionService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) { }

  onAutoResize(): void {
    this.datatableVisible = false;
    this.cdr.detectChanges(); // destroy

    requestAnimationFrame(() => {
      this.datatableVisible = true;
      this.cdr.detectChanges(); // recreate
    });
  }

  ngOnInit(): void {
    const storedUserName = localStorage.getItem('userName');
    this.senderName = storedUserName ? storedUserName : 'Procurement Team';

    this.getEmailLogs();

    this.invitationForm = this.fb.group({
      receiverEmail: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      body: ['', Validators.required],
    });

    this.columns = [
      { prop: 'receiverEmail', name: 'Receiver Email', minWidth: 120 },
      { prop: 'requestStatusName', name: 'Request Status', minWidth: 50, },
      { prop: 'createdDate', name: 'Date', minWidth: 100 }
    ];
  }

  get isMobile(): boolean {
    return window.innerWidth <= 768;
  }


  getEmailLogs() {
    this.loading = true;

    this.EmailTemplateService.getUserInvitation().subscribe({
      next: (res: any[]) => {
        this.allEmailLogs = res.map(item => ({
          id: item.id,
          receiverEmail: item.receiverEmail,
          requestStatusName: item.requestStatusName,
          createdDate: item.createdDate ? new Date(item.createdDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }).replace(/ /g, '-') : '',
          statusClass: `chip ${this.mapStatusKey(item.requestStatusName || item.status)}`
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

  showInProgress() {
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

  ngOnDestroy() {
    tinymce.remove('#emailInvitationEditor');
  }

  initTinyMCE(initialContent: string = '') {
    setTimeout(() => {
      tinymce.remove('#emailInvitationEditor'); // Ensure previous instance is removed
      tinymce.init({
        selector: '#emailInvitationEditor',
        height: 300,
        menubar: false,
        branding: false,
        plugins: [
          'advlist autolink lists link image charmap preview anchor',
          'searchreplace visualblocks code fullscreen insertdatetime media table',
          'emoticons help wordcount autosave directionality visualchars codesample pagebreak quickbars nonbreaking template'
        ],
        toolbar: 'undo redo | blocks | bold italic underline strikethrough ',
        content_style: `body { font-family:Helvetica,Arial,sans-serif; font-size:14px; padding:10px; }`,
        setup: (editor: any) => {
          editor.on('init', () => {
            editor.setContent(initialContent);
          });
          editor.on('change', () => {
            this.invitationForm.patchValue({ body: editor.getContent() });
            this.invitationForm.get('body')?.markAsTouched();
          });
        }
      });
    }, 100);
  }

  CreatInvitations(content) {
    if (!this.permissionService.can(FORM_IDS.INVITATION, 'write'))
      return;
    this.submitted = false;
    this.modalTitle = 'Send Invitation';
    this.modalButtonText = 'Send Invite';
    this.requestStatus = 'Send';

    this.EmailTemplateService.getGlobalEmailTemplate().subscribe({
      next: (res: any) => {
        const subject = res.subject || '';
        let body = res.body || '';

        // Placeholder replacement
        body = body.replace(/%SenderName%/g, this.senderName);

        this.invitationForm.reset({
          receiverEmail: '',
          subject: subject,
          body: body
        });
        this.invitationForm.get('receiverEmail')?.enable();
        this.modalService.open(content, { size: 'lg', centered: true, backdrop: 'static', keyboard: false });
        this.initTinyMCE(body);
      },
      error: (err) => {
        console.error('Error fetching global template:', err);
        this.toastr.error('Failed to load email template. Please try again.', 'Error');
      }
    });
  }


  sendInvitation(modal: any) {
    this.submitted = true;
    if (this.invitationForm.invalid) return;

    // ✅ Duplication check for "Send" request
    if (this.requestStatus === 'Send') {
      const emailExists = this.allEmailLogs.some(log =>
        log.receiverEmail.toLowerCase() === this.invitationForm.value.receiverEmail.toLowerCase()
      );
      if (emailExists) {
        this.toastr.error('Request already exist', 'Error');
        return;
      }
    }

    this.isSending = true; // ✅ Start loader

    // ✅ Get value from form (including disabled fields for Resend)
    const formData = this.invitationForm.getRawValue();
    const receiverEmail = formData.receiverEmail;

    // Fetch content from TinyMCE just in case
    const tinyMceContent = tinymce.get('emailInvitationEditor')?.getContent() || formData.body;

    const userData = {
      submitterName: this.senderName,
      receiverEmail: receiverEmail,
      subject: formData.subject,
      body: tinyMceContent,
      createdDate: new Date().toISOString()
    };

    const apiCall = this.requestStatus === 'Send'
      ? this.EmailTemplateService.createEmailInvitation(userData)
      : this.EmailTemplateService.resendEmailInvitation(userData);

    apiCall.subscribe({
      next: (res) => {
        this.isSending = false; // ✅ Stop loader
        this.toastr.success(`Invitation ${this.requestStatus === 'Send' ? 'sent' : 'resent'} successfully!`, 'Success');

        // ✅ Clear selections after success
        this.chkBoxSelected = [];
        this.enableDisableButtons();

        modal.close();
        this.getEmailLogs();
      },
      error: (err) => {
        this.isSending = false; // ✅ Stop loader
        console.error('Error sending invitation:', err);
        this.toastr.error(`Failed to ${this.requestStatus === 'Send' ? 'send' : 'resend'} invitation.`, 'Error');
      }
    });
  }



  // ✅ UPDATED: Resend button logic to use modal
  resendInvitation(content) {
    if (this.announcementId) {
      const selectedInvitation = this.chkBoxSelected[0];
      this.submitted = false;
      this.modalTitle = 'Resend Invitation';
      this.modalButtonText = 'Resend';
      this.requestStatus = 'Resend';

      this.EmailTemplateService.getGlobalEmailTemplate().subscribe({
        next: (res: any) => {
          const subject = res.subject || '';
          let body = res.body || '';

          // Placeholder replacement
          body = body.replace(/%SenderName%/g, this.senderName);

          this.invitationForm.reset({
            receiverEmail: selectedInvitation.receiverEmail,
            subject: subject,
            body: body
          });
          this.invitationForm.get('receiverEmail')?.disable();
          this.modalService.open(content, { size: 'lg', centered: true, backdrop: 'static', keyboard: false });
          this.initTinyMCE(body);
        },
        error: (err) => {
          console.error('Error fetching global template for resend:', err);
          this.toastr.error('Failed to load email template. Please try again.', 'Error');
        }
      });
    }
  }

  cancel() {
    if (this.isSending) return; // ✅ Don't close if request is pending

    // ✅ Clear selections when closing
    this.chkBoxSelected = [];
    this.enableDisableButtons();
    tinymce.remove('#emailInvitationEditor');
    this.modalService.dismissAll();
  }

  get f() {
    return this.invitationForm.controls;
  }

  private mapStatusKey(status: string): 'chip--success' | 'chip--pending' | 'chip--rejected' | 'chip--approved' {
    const s = status?.toLowerCase();

    if (s === 'completed' || s === 'successful' || s === 'accepted' || s === 'paid' || s === 'delivered' || s === 'active')
      return 'chip--success';

    if (s === 'rejected' || s === 'resend')
      return 'chip--rejected';

    if (s === 'pending for payment' || s === 'pending' || s === 'on hold' || s === 'inactive' || s === 'inprogress' || s === 'draft' || s === 'sendback')
      return 'chip--pending';

    if (s === 'approved for payment' || s === 'approved' || s === 'approve' || s === 'new' || s === 'send')
      return 'chip--approved';
  }
}
