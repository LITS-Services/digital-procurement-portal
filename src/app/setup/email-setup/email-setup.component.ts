import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { AuthService } from 'app/shared/auth/auth.service';

@Component({
  selector: 'app-email-setup',
  templateUrl: './email-setup.component.html',
  styleUrls: ['./email-setup.component.scss']
})
export class EmailSetupComponent implements OnInit {

  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  public chkBoxSelected = [];
  loading = false;
  public rows = [];
  public allEmailLogs = []; // ✅ To store all records
  columns = [];
  announcementId: number;
  isEditButtonDisabled = true;
  isDeleteButtonDisabled = true;
  isOpenButtonDisabled = true;
  isAllSelected = false;

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.getEmailLogs();

    // ✅ Table Columns
    this.columns = [
      { prop: 'receiverEmail', name: 'Receiver Email' },
      { prop: 'requestStatusName', name: 'Request Status' },
      { prop: 'subject', name: 'Subject' },
      { prop: 'body', name: 'Body' }
    ];
  }

  // ✅ Fetch Email Logs
  getEmailLogs() {
    this.loading = true;

    this.authService.getUserInvitation().subscribe({
      next: (res: any[]) => {
        this.allEmailLogs = res.map(item => ({
          id: item.id,
          receiverEmail: item.receiverEmail,
          requestStatusName: item.requestStatusName,
          subject: this.truncateText(item.subject),
          body: this.truncateText(item.body)
        }));

        // ✅ Default → show all
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

  // ✅ Filters
  showAll() {
    this.rows = [...this.allEmailLogs];
  }

  showInProcess() {
    this.rows = this.allEmailLogs.filter(log =>
      log.requestStatusName?.toLowerCase() === 'inprocess'
    );
  }

  showRecall() {
    this.rows = this.allEmailLogs.filter(log =>
      log.requestStatusName?.toLowerCase() === 'recall' || 
      log.requestStatusName?.toLowerCase() === 'sendback' // Optional: include SendBack if needed
    );
  }

  // ✅ Truncate Long Text
  truncateText(text: string, limit: number = 50): string {
    return text && text.length > limit ? text.substring(0, limit) + '...' : text;
  }

  // ✅ Sorting
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

  // ✅ Checkbox Selection
  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [];
    this.chkBoxSelected.splice(0, this.chkBoxSelected.length);
    this.chkBoxSelected.push(...selected);
    this.announcementId = selected[0]?.id;
    this.enableDisableButtons();
  }

  enableDisableButtons() {
    const selectedRowCount = this.chkBoxSelected.length;

    this.isDeleteButtonDisabled = selectedRowCount === 0;
    this.isEditButtonDisabled = selectedRowCount !== 1;
    this.isOpenButtonDisabled = selectedRowCount === 0;

    this.isAllSelected = this.rows.length === selectedRowCount;
  }

  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  CreatInvitations() {
    this.router.navigate(['/setup/create-invitation']);
  }
}
