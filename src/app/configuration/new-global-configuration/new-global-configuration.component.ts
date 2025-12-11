import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbAccordionItem, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { DatatableData } from 'app/data-tables/data/datatables.data';
import { LookupService } from 'app/shared/services/lookup.service';
import { SystemService } from 'app/shared/services/system.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-new-global-configuration',
  templateUrl: './new-global-configuration.component.html',
  styleUrls: ['./new-global-configuration.component.scss'],
  standalone: false
})
export class NewGlobalConfigurationComponent implements OnInit {

  currentRfqNo!: string;
  isNewForm = true; // true = create, false = edit
  isFormDirty = false; // track if any field was touched

  newGlobalConfigForm: FormGroup;
  editingRowIndex: number | null = null; // Track row being edited
  public chkBoxSelected = [];
  loading = false;

  public rows = DatatableData;
  columns = [];
  viewMode = false;
  currentGlobalConfigId: number | null = null;
  globalConfigTypes: any[] = [];

  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  @ViewChild('accordion') accordion: NgbAccordionItem;
  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('tableRowDetails') tableRowDetails: any;
  @ViewChild('tableResponsive') tableResponsive: any;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private toastr: ToastrService, public cdr: ChangeDetectorRef,
    private systemService: SystemService,
    private lookupService: LookupService
  ) { }

  ngOnInit(): void {

    this.newGlobalConfigForm = this.fb.group({
      name: ['', Validators.required],
      value: ['', Validators.required],
      type: ['', Validators.required]
    });

    Promise.all([this.loadGlobalConfigTypes()]).then(
      () => this.route.queryParamMap.subscribe(params => {
        const idParam = params.get('id');
        const mode = params.get('mode');

        this.viewMode = mode === 'view';
        this.isNewForm = !idParam;

        if (idParam) {
          this.currentGlobalConfigId = +idParam;
          this.loadExisting(this.currentGlobalConfigId);
        }
      })
    );
    // this.loadGlobalConfigTypes();
    this.newGlobalConfigForm.valueChanges.subscribe(() => {
      this.isFormDirty = true;
    });


  }

  loadExisting(id: number): void {
    this.systemService.getGlobalConfigById(id).subscribe({
      next: (res) => {
        this.currentGlobalConfigId = res.id;
        if (res) {
          this.newGlobalConfigForm.patchValue({
            name: res.name,
            value: res.value,
            type: res.type
          });

          this.newGlobalConfigForm.get('name')?.disable();
        } else {
          this.toastr.warning('Failed to load global configuration.');
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading global configuration:', err);
        this.toastr.error('Error loading configuration data.');
        this.cdr.detectChanges();
      }
    });
  }

  loadGlobalConfigTypes() {
    this.lookupService.getAllGlobalConfigTypes().subscribe({
      next: (res) => {
        this.globalConfigTypes = res ?? [];
        console.log('Global Config Types:', this.globalConfigTypes);
      },
      error: (err) => {
        console.error('Failed to load global config types:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.newGlobalConfigForm.invalid) {
      this.toastr.error('Please fill out all fields correctly.');
      return;
    }

    const formValue = this.newGlobalConfigForm.getRawValue();
    this.loading = true;

    if (this.currentGlobalConfigId) {
      const payload = {
        id: this.currentGlobalConfigId,
        globalConfiguration: {
          value: formValue.value,
          type: formValue.type
        }
      };

      this.systemService.updateGlobalConfig(payload).subscribe({
        next: (res) => {
          this.loading = false;
          this.router.navigate(['/configuration/global']);
        },
        error: (err) => {
          this.loading = false;
          this.toastr.error('Something went wrong while updating.');
        }
      });
    } else {
      const payload = {
        globalConfiguration: {
          name: formValue.name,
          value: formValue.value,
          type: formValue.type
        }
      };

      this.systemService.createGlobalConfig(payload).subscribe({
        next: (res) => {
          this.loading = false;
          this.router.navigate(['/configuration/global']);
        },
        error: (err) => {
          this.loading = false;
          this.toastr.error(err?.error || 'Something went wrong.');
        }
      });
    }
  }

  homePage() {
    this.router.navigate(['/configuration/global']);
  }
}