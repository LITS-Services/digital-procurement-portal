import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { PermissionService } from 'app/shared/permissions/permission.service';
import { SystemService } from 'app/shared/services/system.service';

type LogType = 'exception' | 'audit-trails'; // Keep original tab name

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit {
  FORM_IDS = FORM_IDS;
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  showFilterBar = false;
  searchTerm: string = '';
  chkBoxSelected: any[] = [];
  loading = false;
  logsData: any[] = [];
  activeFilter: string = 'All';
  statusTouched: boolean = false;
  selectedStatusLabel: string = 'Status';

  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;

  selectedTab: LogType = 'exception'; // Keep original tab
  selectedLog: any = null;
  searchForm: FormGroup;

  @ViewChild('logDetailModal') logDetailModal!: TemplateRef<any>;
  
  constructor(
    private systemService: SystemService,
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal,
    private permissionService: PermissionService,
    private fb: FormBuilder
  ) { 
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadLogs();
  }

  initForm() {
    this.searchForm.get('searchTerm')?.valueChanges.subscribe(value => {
      this.searchTerm = value;
      this.currentPage = 1;
      this.loadLogs();
    });
  }

  getFilterLabel(): string {
    return this.selectedTab === 'exception' ? 'HTTP Method' : 'Action Type';
  }

  selectTab(tab: LogType) {
    if (this.selectedTab !== tab) {
      this.selectedTab = tab;
      this.currentPage = 1;
      this.chkBoxSelected = [];
      this.activeFilter = 'All';
      this.searchTerm = '';
      this.searchForm.patchValue({ searchTerm: '' });
      this.statusTouched = false;
      this.selectedStatusLabel = this.getFilterLabel();
      this.loadLogs();
    }
  }

  loadLogs() {
    this.loading = true;

    const filters = this.buildFilters();

    if (this.selectedTab === 'exception') {
      // Use HTTP logs but map to exception log structure
      this.systemService.getAllHttpLogs(this.currentPage, this.pageSize, filters).subscribe({
        next: (data: any) => this.handleHttpLogsResponse(data),
        error: () => this.loading = false
      });
    } else if (this.selectedTab === 'audit-trails') {
      this.systemService.getAllAuditTrails(this.currentPage, this.pageSize, filters).subscribe({
        next: (data: any) => this.handleResponse(data),
        error: () => this.loading = false
      });
    }
  }

  buildFilters(): any {
    const filters: any = {};

    if (this.searchTerm.trim()) {
      filters.search = this.searchTerm.trim();
    }

    if (this.activeFilter !== 'All') {
      if (this.selectedTab === 'audit-trails') {
        filters.actionType = this.activeFilter;
      } else if (this.selectedTab === 'exception') {
        filters.httpMethod = this.activeFilter;
      }
    }

    return filters;
  }

  handleHttpLogsResponse(data: any) {
    // Map HTTP logs data to exception logs structure with original columns
    this.logsData = (data?.result || []).map((log: any) => ({
      timestamp: log.timestamp,
      exceptionType: log.type || 'HTTP Exception', // Map type to exceptionType
      message: `${log.httpMethod} ${log.url} - Status: ${log.status}`, // Create message from HTTP data
      httpMethod: log.httpMethod,
      body: log.requestBody || log.responseBody || 'No body content', // Use request/response body
      // Keep original data for modal details
      originalData: log
    }));
    
    this.totalPages = data.totalPages;
    this.totalItems = data.totalItems;
    this.loading = false;
    this.cdr.detectChanges();
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
    if(!this.permissionService.can(FORM_IDS.LOGS, 'write'))
      return;
    console.log('Row clicked:', event);

    this.selectedLog = event.row;
    this.modalService.open(this.logDetailModal, { size: 'lg', centered: true });
  }

  onActivate(event: any) {
    if(!this.permissionService.can(FORM_IDS.LOGS, 'write'))
      return;
    if (event.type === 'click' && event.row) {
      this.selectedLog = event.row;
      this.modalService.open(this.logDetailModal, { size: 'lg', centered: true });
    }
  }

  toggleFilterBar() {
    this.showFilterBar = !this.showFilterBar;
  }

  filterByStatus(status: string) {
    this.activeFilter = status;
    this.statusTouched = true;
    this.selectedStatusLabel = status === 'All' ? this.getFilterLabel() : status;
    this.currentPage = 1;
    this.loadLogs();
  }
}