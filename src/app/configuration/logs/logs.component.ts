import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { PermissionService } from 'app/shared/permissions/permission.service';
import { AuthService } from 'app/shared/auth/auth.service';
import { SystemService } from 'app/shared/services/system.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

type LogType = 'exception' | 'audit-trails' | 'security-audit';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
  standalone: false
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

  selectedTab: LogType = 'exception';
  selectedLog: any = null;
  searchForm: FormGroup;

  datatableVisible: boolean = true;

  @ViewChild('logDetailModal') logDetailModal!: TemplateRef<any>;
  
  constructor(
    private systemService: SystemService,
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal,
    private permissionService: PermissionService,
    private authService: AuthService,
    private fb: FormBuilder
  ) { 
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });
  }

  onAutoResize(): void {
    this.datatableVisible = false;
    this.cdr.detectChanges(); // destroy

    requestAnimationFrame(() => {
      this.datatableVisible = true;
      this.cdr.detectChanges(); // recreate
    });
  }

  ngOnInit(): void {
    this.initForm();
    // this.loadLogs();
  }

  initForm() {
    this.searchForm.get('searchTerm')?.valueChanges.subscribe(value => {
      this.searchTerm = value;
      this.currentPage = 1;
      //this.loadLogs();
    });
  }

  get canViewSecurityAudit(): boolean {
    return this.authService.hasRole('Admin')
      || this.authService.hasRole('Super Admin')
      || this.authService.hasPermission('security-audit.view');
  }

  getFilterLabel(): string {
    if (this.selectedTab === 'exception') return 'HTTP Method';
    if (this.selectedTab === 'security-audit') return 'Event Type';
    return 'Action Type';
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
      //this.loadLogs();
    }
  }

  loadLogs() {
    this.loading = true;

    const filters = this.buildFilters();

    if (this.selectedTab === 'exception') {
      // Use HTTP logs but map to exception log structure
      this.systemService.getAllExceptionLogs(this.currentPage, this.pageSize, filters).subscribe({
        next: (data: any) => this.handlExceptionLogsResponse(data),
        error: () => this.loading = false
      });
    } else if (this.selectedTab === 'audit-trails') {
      this.systemService.getAllAuditTrails(this.currentPage, this.pageSize, filters).subscribe({
        next: (data: any) => this.handleResponse(data),
        error: () => this.loading = false
      });
    } else if (this.selectedTab === 'security-audit') {
      this.systemService.getAllSecurityAuditLogs(this.currentPage, this.pageSize, filters).subscribe({
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
      } else if (this.selectedTab === 'security-audit') {
        filters.eventType = this.activeFilter;
      }
    }

    return filters;
  }

  handlExceptionLogsResponse(data: any) {
    // Map HTTP logs data to exception logs structure with original columns
    this.logsData = (data?.result || []).map((log: any) => ({
      timestamp: log.timestamp,
      exceptionType: log.exceptionType || 'HTTP Exception',
      message: `${log.httpMethod} ${log.url} - Status: ${log.status}`,
      httpMethod: log.httpMethod,
      body: log.body || 'No body content',
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

  exportToExcel(): void {
    if (this.logsData.length === 0) {
      return;
    }

    // Prepare data based on selected tab
    let excelData: any[] = [];
    let fileName: string = '';

    if (this.selectedTab === 'exception') {
      excelData = this.prepareExceptionLogsForExcel();
      fileName = `Exception_Logs_${new Date().toISOString().slice(0, 10)}.xlsx`;
    } else if (this.selectedTab === 'audit-trails') {
      excelData = this.prepareAuditTrailsForExcel();
      fileName = `Audit_Trails_${new Date().toISOString().slice(0, 10)}.xlsx`;
    } else if (this.selectedTab === 'security-audit') {
      excelData = this.prepareSecurityAuditForExcel();
      fileName = `Security_Audit_${new Date().toISOString().slice(0, 10)}.xlsx`;
    }

    // Create worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
    
    // Create workbook
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Data': worksheet },
      SheetNames: ['Data']
    };


    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    this.saveExcelFile(excelBuffer, fileName);
  }


  private prepareExceptionLogsForExcel(): any[] {
    return this.logsData.map((log, index) => ({
      'Sr. No.': ((this.currentPage - 1) * this.pageSize) + index + 1,
      'Timestamp': log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A',
      'Exception Type': log.exceptionType || 'N/A',
      'Message': log.message || 'N/A',
      'Http Method': log.httpMethod || 'N/A',
      'Body': log.body || 'N/A'
    }));
  }

  private prepareAuditTrailsForExcel(): any[] {
    return this.logsData.map((log, index) => ({
      'Sr. No.': ((this.currentPage - 1) * this.pageSize) + index + 1,
      'Table Name': log.tableName || 'N/A',
      'Action Type': log.actionType || 'N/A',
      'Timestamp': log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A',
      'Username': log.username || 'N/A',
      'Changes': log.changes || 'N/A',
      'Is Entity Deleted': log.isEntityDeleted || false
    }));
  }

  private prepareSecurityAuditForExcel(): any[] {
    return this.logsData.map((log, index) => ({
      'Sr. No.': ((this.currentPage - 1) * this.pageSize) + index + 1,
      'Timestamp': log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A',
      'Event Type': log.eventType || 'N/A',
      'Outcome': log.outcome || 'N/A',
      'Email': log.email || 'N/A',
      'IP Address': log.ipAddress || 'N/A',
      'Resource': log.resource || 'N/A',
      'Detail': log.detail || 'N/A',
      'Correlation Id': log.correlationId || 'N/A'
    }));
  }

  /**
   * Save Excel file
   */
  private saveExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' 
    });
    
    // Use file-saver to save the file
    saveAs(data, fileName);
  }

  /**
   * Alternative method to export all data (with pagination)
   * This method fetches all data from the server and exports it
   */
  exportAllToExcel(): void {
    if (!confirm('This will export all data from the server. Continue?')) {
      return;
    }

    this.loading = true;
    const filters = this.buildFilters();
    
    // Fetch all data without pagination
    const pageSize = 1000; // Large page size to get all data
    
    if (this.selectedTab === 'exception') {
      this.systemService.getAllExceptionLogs(1, pageSize, filters).subscribe({
        next: (data: any) => {
          this.handleExportAllData(data?.result || [], 'Exception_Logs');
          this.loading = false;
        },
        error: () => this.loading = false
      });
    } else if (this.selectedTab === 'audit-trails') {
      this.systemService.getAllAuditTrails(1, pageSize, filters).subscribe({
        next: (data: any) => {
          this.handleExportAllData(data?.result || [], 'Audit_Trails');
          this.loading = false;
        },
        error: () => this.loading = false
      });
    } else if (this.selectedTab === 'security-audit') {
      this.systemService.getAllSecurityAuditLogs(1, pageSize, filters).subscribe({
        next: (data: any) => {
          this.handleExportAllData(data?.result || [], 'Security_Audit');
          this.loading = false;
        },
        error: () => this.loading = false
      });
    }
  }

  /**
   * Handle exporting all data
   */
  private handleExportAllData(data: any[], exportType: string): void {
    if (data.length === 0) {
      alert('No data to export!');
      return;
    }

    let excelData: any[] = [];
    const fileName = `${exportType}_All_${new Date().toISOString().slice(0, 10)}.xlsx`;

    if (this.selectedTab === 'exception') {
      excelData = data.map((log, index) => ({
        'Sr. No.': index + 1,
        'Timestamp': log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A',
        'Exception Type': log.exceptionType || 'HTTP Exception',
        'Message': `${log.httpMethod} ${log.url} - Status: ${log.status}`,
        'Http Method': log.httpMethod || 'N/A',
        'Body': log.requestBody || log.responseBody || 'No body content',
        'URL': log.url || 'N/A',
        'Status': log.status || 'N/A',
        'Client IP': log.clientIp || 'N/A'
      }));
    } else if (this.selectedTab === 'audit-trails') {
      excelData = data.map((log, index) => ({
        'Sr. No.': index + 1,
        'Table Name': log.tableName || 'N/A',
        'Action Type': log.actionType || 'N/A',
        'Timestamp': log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A',
        'Username': log.username || 'N/A',
        'Changes': typeof log.changes === 'object' ? JSON.stringify(log.changes) : (log.changes || 'N/A'),
        'Is Entity Deleted': log.isEntityDeleted || false,
        'Entity ID': log.entityId || 'N/A'
      }));
    } else if (this.selectedTab === 'security-audit') {
      excelData = data.map((log, index) => ({
        'Sr. No.': index + 1,
        'Timestamp': log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A',
        'Event Type': log.eventType || 'N/A',
        'Outcome': log.outcome || 'N/A',
        'Email': log.email || 'N/A',
        'IP Address': log.ipAddress || 'N/A',
        'Resource': log.resource || 'N/A',
        'Detail': log.detail || 'N/A',
        'Correlation Id': log.correlationId || 'N/A'
      }));
    }

    // Create worksheet and workbook
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Data': worksheet },
      SheetNames: ['Data']
    };

    // Generate and save Excel file
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveExcelFile(excelBuffer, fileName);
  }
}