import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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

  // Shared state
  chkBoxSelected: any[] = [];
  loading = false;
  logsData: any[] = [];

  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;

  selectedTab: LogType = 'exception'; // default tab

  constructor(private systemService: SystemService,
              private cdr: ChangeDetectorRef) { }

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

  // loadLogs() {
  //   this.loading = true;

  //   if (this.selectedTab === 'exception') {
  //     this.columns = [
  //       { name: 'Sr. No.', cellTemplate: 'srNoTemplate', width: 50 },
  //       { name: 'TimeStamp', prop: 'timestamp' },
  //       { name: 'Exception Type', prop: 'exceptionType' },
  //       { name: 'Message', prop: 'message' },
  //       { name: 'Http Method', prop: 'httpMethod' },
  //       { name: 'Body', prop: 'body' }
  //     ];

  //     this.systemService.getAllExceptionLogs(this.currentPage, this.pageSize).subscribe({
  //       next: (data: any) => this.handleResponse(data),
  //       error: () => this.loading = false
  //     });
  //   } else if (this.selectedTab === 'http') {
  //     this.columns = [
  //       { name: 'Sr. No.', cellTemplate: 'srNoTemplate', width: 50 },
  //       { name: 'TimeStamp', prop: 'timestamp' },
  //       { name: 'Http Method', prop: 'httpMethod' },
  //       { name: 'Url', prop: 'url' },
  //       { name: 'Request Body', prop: 'requestBody', sortable: false },
  //       { name: 'Response Body', prop: 'responseBody' },
  //       { name: 'Status', prop: 'status' }
  //     ];

  //     this.systemService.getAllHttpLogs(this.currentPage, this.pageSize).subscribe({
  //       next: (data: any) => this.handleResponse(data),
  //       error: () => this.loading = false
  //     });
  //   }
  // }

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

}
