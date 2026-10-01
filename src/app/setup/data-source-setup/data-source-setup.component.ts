import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { PermissionService } from 'app/shared/permissions/permission.service';
import {
  DATA_SOURCE_FORM_CATALOG,
  DataSourceFormOption,
  DataSourceMode,
  DataSourceState,
  DEFAULT_DATA_SOURCE_STATE
} from 'app/shared/services/data-source.models';
import { DataSourceService } from 'app/shared/services/data-source.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

interface FormRowItem {
  key: string;
  label: string;
  route: string;
  active: boolean;
}

@Component({
  selector: 'app-data-source-setup',
  templateUrl: './data-source-setup.component.html',
  styleUrls: ['./data-source-setup.component.scss'],
  standalone: false
})
export class DataSourceSetupComponent implements OnInit {
  @ViewChild('datatable', { static: false }) datatable!: DatatableComponent;
  FORM_IDS = FORM_IDS;

  mode: DataSourceMode = 'local';
  listedForms: string[] = [...DEFAULT_DATA_SOURCE_STATE.listedForms];
  businessCentralForms: string[] = [...DEFAULT_DATA_SOURCE_STATE.businessCentralForms];
  formRows: FormRowItem[] = [];

  selectedFormToAdd: string | null = null;
  loading = false;
  saving = false;

  get isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private cdr: ChangeDetectorRef,
    private dataSourceService: DataSourceService,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  homePage(): void {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  load(): void {
    this.loading = true;
    this.spinner.show();

    this.dataSourceService.load().subscribe({
      next: (state: DataSourceState) => {
        this.mode = state.mode;
        this.listedForms = [...state.listedForms];
        this.businessCentralForms = [...state.businessCentralForms];
        this.buildFormRows();
        this.loading = false;
        this.spinner.hide();
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.spinner.hide();
        this.buildFormRows();
        this.cdr.detectChanges();
        this.toastr.error('Failed to load data source settings.');
      }
    });
  }

  setMode(mode: DataSourceMode): void {
    if (!this.canWrite) return;
    this.mode = mode;
    this.cdr.detectChanges();
  }

  get canWrite(): boolean {
    return this.permissionService.canWrite(FORM_IDS.DATA_SOURCE);
  }

  availableFormsToAdd: DataSourceFormOption[] = [];

  updateAvailableForms(): void {
    const current = new Set(this.listedForms);
    this.availableFormsToAdd = DATA_SOURCE_FORM_CATALOG.filter(form => !current.has(form.key));
  }

  buildFormRows(): void {
    const listed = new Set(this.listedForms);
    const active = new Set(this.businessCentralForms);

    this.formRows = DATA_SOURCE_FORM_CATALOG
      .filter(f => listed.has(f.key))
      .map(f => ({
        key: f.key,
        label: f.label,
        route: f.route,
        active: active.has(f.key)
      }));

    this.updateAvailableForms();
  }

  openAddModal(content: any): void {
    this.selectedFormToAdd = null;
    this.updateAvailableForms();
    this.modalService.open(content, {
      centered: true,
      size: 'md',
      windowClass: 'data-source-modal'
    });
  }

  onFormOptionSelected(selected: any): void {
    if (!selected) {
      this.selectedFormToAdd = null;
    } else if (typeof selected === 'string') {
      this.selectedFormToAdd = selected;
    } else if (selected.key) {
      this.selectedFormToAdd = selected.key;
    }
    this.cdr.detectChanges();
  }

  confirmAddForm(modal: any): void {
    if (!this.selectedFormToAdd) return;

    const key = this.selectedFormToAdd;
    if (!this.listedForms.includes(key)) {
      this.listedForms.push(key);
    }
    if (!this.businessCentralForms.includes(key)) {
      this.businessCentralForms.push(key);
    }

    this.buildFormRows();
    modal.close();
    this.cdr.detectChanges();
  }

  removeForm(key: string): void {
    if (!this.canWrite) return;

    this.listedForms = this.listedForms.filter(k => k !== key);
    this.businessCentralForms = this.businessCentralForms.filter(k => k !== key);
    this.buildFormRows();
    this.cdr.detectChanges();
  }

  save(): void {
    if (!this.canWrite) {
      this.toastr.warning('You do not have write permission for Data Source setup.');
      return;
    }

    this.saving = true;
    this.spinner.show();

    // Commit active forms
    const activeKeys = this.formRows.filter(r => r.active).map(r => r.key);
    this.businessCentralForms = activeKeys;

    const payload: DataSourceState = {
      mode: this.mode,
      businessCentralForms: this.businessCentralForms,
      listedForms: this.listedForms
    };

    this.dataSourceService.save(payload).subscribe({
      next: () => {
        this.saving = false;
        this.spinner.hide();
        this.toastr.success('Data source settings saved successfully.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving = false;
        this.spinner.hide();
        this.toastr.error('Failed to save data source settings.');
        this.cdr.detectChanges();
      }
    });
  }
}
