import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { SystemService } from 'app/shared/services/system.service';

type LogType = 'exception' | 'http';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit {

  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  chkBoxSelected: any[] = [];
  loading = false;
  logsData: any[] = [];

  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;

  selectedTab: LogType = 'exception'; // default tab
  selectedLog: any = null;

  @ViewChild('logDetailModal') logDetailModal!: TemplateRef<any>;
  constructor(private systemService: SystemService,
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal) { }

  ngOnInit(): void {
    this.loadLogs();
  }

  selectTab(tab: LogType) {
    if (this.selectedTab !== tab) {
      this.selectedTab = tab;
      this.currentPage = 1; // reset pagination
      this.chkBoxSelected = [];
      this.loadLogs();
    }
  }

  loadLogs() {
    this.loading = true;

    if (this.selectedTab === 'exception') {
      this.systemService.getAllExceptionLogs(this.currentPage, this.pageSize).subscribe({
        next: (data: any) => this.handleResponse(data),
        error: () => this.loading = false
      });
    } else if (this.selectedTab === 'http') {
      this.systemService.getAllHttpLogs(this.currentPage, this.pageSize).subscribe({
        next: (data: any) => this.handleResponse(data),
        error: () => this.loading = false
      });
    }
  }

  handleResponse(data: any) {
    this.logsData = data?.result || [];
    this.totalPages = data.totalPages;
    this.totalItems = data.totalItems;
    this.loading = false;
    this.cdr.detectChanges();
  }

  onPageChange(event: any) {
    this.currentPage = (event.offset ?? 0) + 1;
    this.loadLogs();
  }

  onRowClick(event: any) {
    console.log('Row clicked:', event);

    this.selectedLog = event.row;
    this.modalService.open(this.logDetailModal, { size: 'lg', centered: true });
  }

  onActivate(event: any) {
    // We only want clicks, not mouseenter or keydown etc.
    if (event.type === 'click' && event.row) {
      this.selectedLog = event.row;
      this.modalService.open(this.logDetailModal, { size: 'lg', centered: true });
    }
  }
}
