import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { AbstractControl, FormGroup, FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbAccordionDirective, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, id, SelectionType } from '@swimlane/ngx-datatable';
import { DatatableData } from 'app/data-tables/data/datatables.data';
import { PurchaseRequestAttachmentModalComponent } from 'app/shared/modals/purchase-request-attachment-modal/purchase-request-attachment-modal.component';
import { CompanyService } from 'app/shared/services/Company.services';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { ToastrService } from 'ngx-toastr';
import { PurchaseRequestRemarksComponent } from '../purchase-request-remarks/purchase-request-remarks.component';
import { WorkflowServiceService } from 'app/shared/services/WorkflowService/workflow-service.service';
import Swal from 'sweetalert2';
import { LookupService } from 'app/shared/services/lookup.service';
import { VendorAndCompanyForFinalSelectionVM } from 'app/shared/interfaces/vendor-company-final-selection.model';
import { ProjectItem, ProjectActivityItem, ProjectService } from 'app/shared/services/project.service';
import * as XLSX from 'xlsx';
import { NgxSpinnerService } from 'ngx-spinner';
import { catchError, distinctUntilChanged, filter, finalize, map, pairwise, startWith, takeUntil } from 'rxjs/operators';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';
import { PurchaseRequestExceptionPolicyComponent } from 'app/shared/modals/purchase-request-exception-policy/purchase-request-exception-policy.component';
import { forkJoin, of, Subject } from 'rxjs';
import { CountryISO, PhoneNumberFormat, SearchCountryField } from 'ngx-intl-tel-input';
import { PhoneNumberUtil, PhoneNumberFormat as LibPhoneNumberFormat } from 'google-libphonenumber';
import { DataSourceService } from 'app/shared/services/data-source.service';
import { NgSelectComponent } from '@ng-select/ng-select';

@Component({
  selector: 'app-new-purchase-request',
  templateUrl: './new-purchase-request.component.html',
  styleUrls: ['./new-purchase-request.component.scss'],
  standalone: false
})

export class NewPurchaseRequestComponent implements OnInit, AfterViewInit, OnDestroy {
  uploadedItems: any[] = [];

  // ngx-intl-tel-input config (used in template)
  SearchCountryField = SearchCountryField;
  PhoneNumberFormat = PhoneNumberFormat;
  preferredCountries: CountryISO[] = [
    CountryISO.Pakistan,
    CountryISO.UnitedArabEmirates,
    CountryISO.SaudiArabia,
    CountryISO.UnitedStates,
    CountryISO.UnitedKingdom
  ];

  selectedCountryISO: CountryISO = CountryISO.Qatar;
  private phoneUtil = PhoneNumberUtil.getInstance();
  private readonly receiverContactValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const phoneValue = this.normalizePhoneToString(value);
    if (!phoneValue) return { invalidPhoneNumber: true };

    try {
      const parsedNumber = this.phoneUtil.parseAndKeepRawInput(phoneValue);
      const isValid = this.phoneUtil.isValidNumber(parsedNumber);
      return isValid ? null : { invalidPhoneNumber: true };
    } catch {
      return { invalidPhoneNumber: true };
    }
  };

  isNewForm = true; // true = create, false = edit
  isFormDirty = false; // track if any field was touched
  currentRequisitionNo!: string;

  isStatusCompleted: boolean = false;
  isStatusRejected: boolean = false;
  isStatusDraft: boolean = false;
  isStatusInProgress: boolean = false;
  isSubmitter: boolean = false;
  isMainApprover: boolean = false;
  pendingAttachment: any[] = [];
  attachmentList: any[] = [];
  numberOfAttachments = 0;

  newPurchaseItemData = [];

  workflowList: any[] = []
  workflowTypes: any[] = [];

  // new work
  itemList: any[] = [];
  unitsOfMeasurementList: any[] = [];
  uomMasterList: any[] = [];
  vatProdPostingGroups: any[] = [];
  selectedUomLabel = '';
  dimensionList: any[] = [];
  dimensionValueList: any[] = [];
  isDimensionValueLocked = false;
  accountList: any[] = [];
  departmentList: Array<{ id: number; name: string; description?: string }> = [];
  projectList: ProjectItem[] = [];
  filteredProjectList: ProjectItem[] = [];
  currentProjectActivities: ProjectActivityItem[] = [];
  selectedProjectInfo: ProjectItem | null = null;
  selectedActivityInfo: ProjectActivityItem | null = null;
  isBudgetExceeded = false;
  budgetExceededMessage = '';
  budgetWarningType: 'none' | 'warning' | 'danger' | 'orange' = 'none';

  vendorUsers: any[] = [];

  viewMode = false;
  //dataLoaded = false;

  newPurchaseRequestForm: FormGroup;
  itemForm: FormGroup;

  editingRowIndex: number | null = null; // Track row being edited
  isPatchingRow = false;

  public chkBoxSelected = [];
  loading = false;
  // public rows = [];
  public rows = DatatableData;
  columns = [];
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  currentRequestId: number | null = null;
  itemStatusCountData: any = null;

  isSelectingFinalVendor: boolean = false;
  exceptionPolicyData: any = null;
  // finalVendors: any[] = [];

  // ---------------
  finalVendors: VendorAndCompanyForFinalSelectionVM[] = [];
  filteredCompanies: any = null;

  vendorList: any[] = [];
  vendorCompanyList: any[] = [];
  // accountList: any[] = [];
  // itemList: any[] = [];
  uomList: any[] = [];

  addresses: any[] = [];

  entities: Array<{ id: number; description: string; stringId?: string }> = [];
  isEntityLocked = false;
  entityHint = '';
  isToolbarSticky = false;
  procurementUserId = localStorage.getItem('userId');
  selectedRow: any;
  isInventoryTransferMode: boolean = false;
  compareIds = (a: string | null, b: string | null) => (a ?? '').toLowerCase() === (b ?? '').toLowerCase();

  isReceivingOpen = true;
  isPurchaseOpen = true;


  private destroy$ = new Subject<void>();

  showExceptionPolicyView = false;
  private exceptionModalOpen = false;
  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('tableRowDetails') tableRowDetails: any;
  @ViewChild('tableResponsive') tableResponsive: any;
  @ViewChild('receiverIntlWrap', { read: ElementRef }) receiverIntlWrap?: ElementRef<HTMLElement>;

  private receiverIntlMutationObserver?: MutationObserver;
  private receiverIntlSearchUnlisten?: () => void;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private purchaseRequestService: PurchaseRequestService,
    private lookupService: LookupService,
    private fb: FormBuilder,
    public toastr: ToastrService,
    private WorkflowServiceService: WorkflowServiceService,
    public cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService,
    private companyService: CompanyService,
    private purchaseOrderService: PurchaseOrderService,
    private projectService: ProjectService,
    private renderer: Renderer2,
    private dataSourceService: DataSourceService

  ) { }

  /**
   * True when the system is in BusinessCentral mode AND 'purchase-order' is in businessCentralForms.
   * In this case the button shown in the form should be "+ Request PO" (existing behaviour).
   * Otherwise the button should be "+ Create PO" and the direct creation flow is used.
   */
  get useRequestPOMode(): boolean {
    const state = this.dataSourceService.currentState;
    return (
      state.mode === 'businessCentral' &&
      state.businessCentralForms.includes('purchase-order')
    );
  }

  private normalizePhoneToString(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;

    return (
      value?.e164Number ||
      null
    );
  }


  ngOnInit(): void {
    // Purchase Request Form
    this.newPurchaseRequestForm = this.fb.group({
      requisitionNo: [{ value: '', disabled: true }],
      submittedDate: [null],
      status: [{ value: null, disabled: true }],
      deliveryLocation: [''],
      receiverName: [''],
      receiverContact: ['', [Validators.required, this.receiverContactValidator]],
      department: [null],
      designation: [''],
      businessUnit: [''],
      partialDeliveryAcceptable: [true],
      exceptionPolicy: [false],
      subject: [''],
      entityId: [null, Validators.required],
      dimensionId: [null],
      dimensionValueId: [null],
      addressId: [null, Validators.required],
      country: [{ value: '', disabled: true }],
      city: [{ value: '', disabled: true }],
      region: [{ value: '', disabled: true }],
      address: [{ value: '', disabled: true }],
      address2: [{ value: '', disabled: true }],
      postCode: [{ value: '', disabled: true }],
    });

    // Purchase Item Form
    this.itemForm = this.fb.group({
      id: [null],
      requisitionNo: [''],
      itemType: ['Inventory', Validators.required],
      projectId: [null],
      projectActivityId: [null],
      itemId: [null],
      unitOfMeasurementId: [0],
      amount: [0],
      // unitCost kept for API shape; UI removed — always 0 on save unless loaded from existing PR.
      unitCost: [0],
      orderQuantity: [0],
      reqByDate: [this.toDateInputValue(new Date())],
      itemDescription: [''],
      vendorUserId: [null],
      vendorCompanyId: [null],
      accountId: [1],
      remarks: [''],
      attachments: this.fb.group([])
    });

    this.loadAccounts();
    this.loadDepartments();
    this.loadProjects();
    this.loadUnitsOfMeasurements();
    this.itemForm.get('unitOfMeasurementId')?.disable({ emitEvent: false });
    this.itemForm.get('itemId')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(itemId => this.onItemSelected(itemId));

    this.itemForm.get('orderQuantity')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.recalculateBudgetAmount());

    this.itemForm.get('projectId')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(projId => {
        const numericId = projId ? Number(projId) : null;
        this.selectedProjectInfo = this.projectList.find(p => Number(p.id) === numericId) || null;
        this.currentProjectActivities = this.selectedProjectInfo?.projectActivities || [];
        const currentActId = this.itemForm.get('projectActivityId')?.value ? Number(this.itemForm.get('projectActivityId')?.value) : null;
        this.selectedActivityInfo = this.currentProjectActivities.find(a => Number(a.id) === currentActId) || null;
        this.checkBudgetLimit();
      });

    this.itemForm.get('projectActivityId')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(actId => {
        const numericId = actId ? Number(actId) : null;
        this.selectedActivityInfo = this.currentProjectActivities.find(a => Number(a.id) === numericId) || null;
        this.checkBudgetLimit();
      });

    this.itemForm.get('amount')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.checkBudgetLimit());

    this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      const mode = params.get('mode');

      this.viewMode = mode === 'view';
      this.isNewForm = !id;

      //  Add this part for Final Vendor mode
      if (mode === 'selectVendor' && id) {
        this.isSelectingFinalVendor = true;
        this.loadExistingRequest(+id, false, false, true);
        this.loadVendorsFinalSelection();

        if (this.isSelectingFinalVendor) {
          // Disable the main purchase request form
          this.newPurchaseRequestForm.disable({ emitEvent: false });

          // Disable all item form fields except vendor fields
          Object.keys(this.itemForm.controls).forEach(key => {
            this.itemForm.get(key)?.disable({ emitEvent: false });
          });
          this.syncFinalVendorControlState();
        }
      }

      else if (id) {
        this.currentRequestId = +id;
        this.loadExistingRequest(+id);
      }


    });



    this.newPurchaseRequestForm.valueChanges.subscribe(() => {
      this.isFormDirty = true;
    });

    this.newPurchaseRequestForm.get('workflowType')?.valueChanges.subscribe(selectedId => {
      if (selectedId) {
        this.GetWorkflowMasterByTypeId(selectedId);
      }
    });


    // this.newPurchaseRequestForm.get('exceptionPolicy')?.valueChanges.subscribe(checked => {
    //   if (checked) {
    //     this.openExceptionPolicyModal();
    //     this.cdr.detectChanges();
    //   } else {
    //     this.exceptionPolicyData = null;
    //   }
    // });



    // this.itemForm = this.fb.group({
    //   id: [null],
    //   requisitionNo: [''],
    //   itemType: ['', Validators.required],
    //   itemId: [0, Validators.required],
    //   unitOfMeasurementId: [0, Validators.required],
    //   amount: [0],
    //   unitCost: [0, Validators.required],
    //   orderQuantity: [0, Validators.required],
    //   reqByDate: [null, Validators.required],
    //   itemDescription: ['', Validators.required],
    //   vendorUserId: [null],
    //   vendorCompanyId: [null],
    //   accountId: [0, Validators.required],
    //   remarks: ['', Validators.required],
    //   attachments: this.fb.group({})
    // });

    this.itemForm.valueChanges.subscribe(() => {
      this.isFormDirty = true;
    });

    this.checkEntitySelection();
    if (this.viewMode) {
      this.newPurchaseRequestForm.disable();
      this.itemForm.disable();
    }
  }

  ngAfterViewInit(): void {
    this.setupReceiverIntlCountryListFilter();
  }

  ngOnDestroy(): void {
    this.panelPositionObserver?.disconnect();
    this.panelResizeObserver?.disconnect();
    this.receiverIntlMutationObserver?.disconnect();
    this.receiverIntlSearchUnlisten?.();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * ngx-intl-tel-input only scrolls to the first match; it does not filter the dropdown.
   * We hide non-matching rows so unrelated countries (e.g. Uganda/Ukraine for "united s") disappear.
   */
  private setupReceiverIntlCountryListFilter(): void {
    const root = this.receiverIntlWrap?.nativeElement;
    if (!root || typeof MutationObserver === 'undefined') return;

    const bindIfNeeded = (): void => {
      const searchInput = root.querySelector<HTMLInputElement>('#country-search-box');
      if (!searchInput || searchInput.dataset['receiverIntlFilter'] === '1') return;

      this.receiverIntlSearchUnlisten?.();
      searchInput.dataset['receiverIntlFilter'] = '1';

      this.receiverIntlSearchUnlisten = this.renderer.listen(searchInput, 'input', () => {
        this.applyReceiverIntlCountryRowFilter(root, searchInput.value);
      });
      this.applyReceiverIntlCountryRowFilter(root, searchInput.value);
    };

    this.receiverIntlMutationObserver?.disconnect();
    this.receiverIntlMutationObserver = new MutationObserver(() => bindIfNeeded());
    this.receiverIntlMutationObserver.observe(root, { childList: true, subtree: true });
    bindIfNeeded();
  }

  private applyReceiverIntlCountryRowFilter(host: HTMLElement, raw: string): void {
    const q = raw.trim().toLowerCase().replace(/\s+/g, ' ');
    host.querySelectorAll<HTMLLIElement>('.iti__country-list li.iti__country').forEach(li => {
      const nameText = (li.querySelector('.iti__country-name')?.textContent || '').trim().toLowerCase();
      const dialDigits = (li.querySelector('.iti__dial-code')?.textContent || '')
        .replace(/\D/g, '')
        .toLowerCase();
      const words = NewPurchaseRequestComponent.extractCountryLabelWords(nameText);
      const tokens = q.split(/\s+/).filter(Boolean);
      const show =
        !q ||
        tokens.length === 0 ||
        tokens.every((tok) =>
          NewPurchaseRequestComponent.receiverIntlTokenMatches(tok, words, dialDigits)
        );
      this.renderer.setStyle(li, 'display', show ? '' : 'none');
    });

    this.hideStandardRowWhenPreferredDuplicateVisible(host);
  }

  /**
   * Preferred countries appear twice: once under `iti__preferred` and again in the full list.
   * Hide the standard row when the preferred row for the same country is visible (search may hide preferred only).
   */
  private hideStandardRowWhenPreferredDuplicateVisible(host: HTMLElement): void {
    const standards = host.querySelectorAll<HTMLLIElement>('li.iti__country.iti__standard');

    host.querySelectorAll<HTMLLIElement>('li.iti__country.iti__preferred').forEach((pref) => {
      const pid = pref.getAttribute('id');
      if (!pid?.endsWith('-preferred')) return;

      const baseId = pid.slice(0, -'-preferred'.length);
      const standard = Array.from(standards).find((li) => li.getAttribute('id') === baseId);
      if (!standard) return;

      const prefHidden = pref.style.display === 'none';
      if (!prefHidden) {
        this.renderer.setStyle(standard, 'display', 'none');
      }
    });
  }

  /** English / Latin segments of the dropdown label — used only for filtering, not display. */
  private static extractCountryLabelWords(nameLower: string): string[] {
    return nameLower.match(/[a-z0-9]+/gi) ?? [];
  }

  /**
   * Each search term matches only as a dial-code substring OR as a whole-word prefix/exact hit
   * on the Latin name segments (never arbitrary substring — avoids unrelated countries).
   */
  private static receiverIntlTokenMatches(
    token: string,
    latinWords: string[],
    dialDigits: string
  ): boolean {
    if (/^\d+$/.test(token)) {
      return dialDigits.startsWith(token);
    }

    const t = token.toLowerCase();
    return latinWords.some((w) => w === t || w.startsWith(t));
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const threshold = 200; // adjust as you like
    this.isToolbarSticky = window.scrollY > threshold;
    if (this.currentlyOpenSelect) {
      this.adjustDropdownPosition(this.currentlyOpenSelect);
    }
  }

  // onPanelChange(event: NgbPanelChangeEvent) {
  //   if (event.panelId === 'receiving-panel') {
  //     this.isReceivingOpen = event.nextState;
  //   }

  //   if (event.panelId === 'purchase-panel') {
  //     this.isPurchaseOpen = event.nextState;
  //   }
  // }

  private patchReceiverContactFromE164(e164: string | null | undefined): void {
    if (!e164) return;

    try {
      const phone = this.phoneUtil.parseAndKeepRawInput(e164);
      const region = this.phoneUtil.getRegionCodeForNumber(phone) || 'PK';

      this.selectedCountryISO = (CountryISO as any)[region] ?? CountryISO.Pakistan;

      // build the object ngx-intl-tel-input understands
      const valueObj = {
        number: String(phone.getNationalNumber()),
        internationalNumber: this.phoneUtil.format(phone, LibPhoneNumberFormat.INTERNATIONAL),
        nationalNumber: this.phoneUtil.format(phone, LibPhoneNumberFormat.NATIONAL),
        e164Number: this.phoneUtil.format(phone, LibPhoneNumberFormat.E164),
        countryCode: region,
        dialCode: `+${phone.getCountryCode()}`
      };

      this.newPurchaseRequestForm.get('receiverContact')?.setValue(valueObj, { emitEvent: false });
    } catch {
      this.newPurchaseRequestForm.get('receiverContact')?.setValue(e164, { emitEvent: false });
    }
  }

  private checkEntitySelection(): void {
    if (!this.isNewForm) return;
    this.applyEntity(null);
  }

  private applyEntity(prId: number | null, prEntityId?: number | null): void {
    const ctrl = this.newPurchaseRequestForm.get('entityId');
    if (!ctrl) return;

    const lsEntity = localStorage.getItem('selectedCompanyId');
    const userId = localStorage.getItem('userId') || '';

    const wantsLock = !!lsEntity && lsEntity !== 'All';
    const desiredId: number | null = wantsLock ? Number(lsEntity) : prId ?? null;

    const setUI = () => {
      // set value if exist (update mode/already selected entity)
      if (desiredId != null && this.entities?.some((e) => e.id === desiredId)) {
        ctrl.setValue(desiredId, { emitEvent: false });
        this.loadAddressOnEntityChanges();
      } else if (!wantsLock) {
        // allow user to choose ('All entity case')
        ctrl.setValue(null, { emitEvent: false });
      }

      // disable field
      this.isEntityLocked = wantsLock;
      this.entityHint = wantsLock ? 'To change entity, select it from the top bar' : '';
      if (prId) {
        this.isEntityLocked = true;
        ctrl.disable({ emitEvent: false });

        this.entityHint = lsEntity === 'All' ? 'Entity cannot be changed in update mode' : '';
      } else {
        this.isEntityLocked = wantsLock;
        this.entityHint = wantsLock ? 'To change entity, select it from the top bar' : '';

        if (wantsLock) ctrl.disable({ emitEvent: false });
        else ctrl.enable({ emitEvent: false });
      }
      this.cdr.markForCheck();
      this.loadItemsForSelectedEntity();
      this.loadDimensionsForSelectedEntity(false);
    };

    // If viewing existing PR and user doesn't have entities loaded, or PR entity not in user's list
    if (prEntityId && (!this.entities?.length || !this.entities.some(e => e.id === prEntityId))) {
      this.loadEntityDirectlyById(prEntityId, () => setUI());
    } else if (!this.entities?.length && userId) {
      this.loadEntitiesForUser(userId, () => setUI());
    } else {
      setUI();
    }
  }

  private loadEntitiesForUser(userId: string, after?: () => void): void {
    this.lookupService.getProcCompaniesByProcUserId(userId).subscribe({
      next: (res: any[]) => {
        this.entities = (res || []).map((e: any) => ({
          id: e.id ?? e.Id,
          description: e.description ?? e.Description,
          stringId: e.stringId ?? e.StringId ?? null
        }));
        after?.();
      },
      error: (err) => console.error('Error fetching entities:', err),
    });
  }

  /**
   * Load a specific entity by ID, bypassing user-entity linkage.
   * Used when approver needs to view PR with entity they're not linked to.
   */
  private loadEntityDirectlyById(entityId: number, after?: () => void): void {
    this.companyService.getProcurementCompanyById(entityId).subscribe({
      next: (res) => {
        const entity = {
          id: res.id ?? entityId,
          description: res.description ?? res.name ?? '',
          stringId: res.companyGUID ?? res.companyGuid ?? null
        };

        // Add to entities list if not already present
        if (!this.entities.some(e => e.id === entity.id)) {
          this.entities = [...this.entities, entity];
        }
        
        after?.();
      },
      error: (err) => {
        console.error('Error fetching entity by ID:', err);
        after?.();
      }
    });
  }

  loadAddresses(entityId: number, callback?: () => void) {
    this.companyService.getProcurementCompanyById(entityId).subscribe({
      next: (res) => {
        this.addresses = res.addressDetails ?? [];
        this.cdr.markForCheck();
        if (callback) callback();
      },
      error: () => this.toastr.error("Unable to load addresses"),
    });
  }

  loadAddressOnEntityChanges() {
    const entityId = this.newPurchaseRequestForm.get('entityId')?.value;
    const addressId = this.newPurchaseRequestForm.get('addressId')?.value;

    if (!entityId) return;

    this.loadAddresses(entityId, () => {
      if (this.isNewForm) {
        this.newPurchaseRequestForm.patchValue({ addressId: null }, { emitEvent: false });
      } else if (addressId) {
        this.newPurchaseRequestForm.patchValue({ addressId: addressId });
        this.onAddressSelect(addressId);
      }
    });
  }

  onEntityChanged(): void {
    const entityId = this.newPurchaseRequestForm.get('entityId')?.value;
    if (!entityId) {
      this.addresses = [];
      this.newPurchaseRequestForm.patchValue({
        addressId: null,
        country: '',
        city: '',
        region: '',
        address: '',
        address2: '',
        postCode: ''
      }, { emitEvent: false });
    }
    this.loadAddressOnEntityChanges();
    this.resetItemAndUomSelection();
    this.loadItemsForSelectedEntity();
    this.loadDimensionsForSelectedEntity(true);
  }

  private getSelectedEntityGuid(): string | null {
    const entityId = Number(this.newPurchaseRequestForm.get('entityId')?.value);
    if (!entityId) return null;
    const match = this.entities?.find(e => Number(e.id) === entityId);
    const guid = match?.stringId?.trim();
    return guid || null;
  }

  loadItemsForSelectedEntity(): void {
    const entityId = Number(this.newPurchaseRequestForm.get('entityId')?.value);
    if (!entityId) {
      this.itemList = [];
      this.vatProdPostingGroups = [];
      return;
    }

    const guid = this.getSelectedEntityGuid();
    if (guid) {
      this.fetchEntityLookups(guid);
      return;
    }

    this.companyService.getProcurementCompanyById(entityId).subscribe({
      next: (res) => {
        const companyGuid = res?.companyGUID || res?.companyGuid || null;
        if (companyGuid) {
          const entity = this.entities?.find(e => Number(e.id) === entityId);
          if (entity) entity.stringId = companyGuid;
          this.fetchEntityLookups(companyGuid);
        } else {
          this.itemList = [];
          this.vatProdPostingGroups = [];
        }
      },
      error: () => {
        this.itemList = [];
        this.vatProdPostingGroups = [];
      }
    });
  }

  private fetchEntityLookups(entityGuid: string): void {
    this.purchaseRequestService.getItems(entityGuid).subscribe({
      next: (res) => {
        this.itemList = res ?? [];
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load items for entity:', err)
    });

    this.lookupService.getVatProdPostingGroups(entityGuid).subscribe({
      next: (res) => {
        this.vatProdPostingGroups = res ?? [];
      },
      error: (err) => console.error('Failed to load VAT prod posting groups:', err)
    });
  }

  onItemSelected(itemId: any): void {
    const id = Number(itemId);
    if (!id || Number.isNaN(id) || id <= 0) {
      this.unitsOfMeasurementList = [];
      this.selectedUomLabel = '';
      this.itemForm.get('unitOfMeasurementId')?.setValue(null, { emitEvent: false });
      return;
    }

    const selectedItem = this.itemList?.find(i => Number(i.id) === id);
    if (selectedItem) {
      const unitPrice = Number(selectedItem.unitPrice) || 0;
      this.itemForm.patchValue({ unitCost: unitPrice }, { emitEvent: false });
      if (!this.isPatchingRow) {
        this.recalculateBudgetAmount();
      }
    }

    this.lookupService.getUomByItem(id).subscribe({
      next: (res) => {
        this.unitsOfMeasurementList = res ?? [];
        const symbol = this.unitsOfMeasurementList[0];
        this.selectedUomLabel = symbol?.description || symbol?.stringId || '';
        this.itemForm.get('unitOfMeasurementId')?.setValue(this.resolveUnitOfMeasurementId(symbol), { emitEvent: false });
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load UOM for item:', err);
        this.unitsOfMeasurementList = [];
        this.selectedUomLabel = '';
        this.itemForm.get('unitOfMeasurementId')?.setValue(null, { emitEvent: false });
      }
    });
  }

  recalculateBudgetAmount(): void {
    if (this.isPatchingRow) return;
    const itemId = Number(this.itemForm.get('itemId')?.value);
    if (!itemId) return;

    const selectedItem = this.itemList?.find(i => Number(i.id) === itemId);
    const unitPrice = selectedItem?.unitPrice != null
      ? Number(selectedItem.unitPrice)
      : (Number(this.itemForm.get('unitCost')?.value) || 0);

    const qty = Number(this.itemForm.get('orderQuantity')?.value) || 0;
    const totalAmount = qty * unitPrice;

    this.itemForm.patchValue({
      amount: totalAmount,
      unitCost: unitPrice
    }, { emitEvent: false });

    this.checkBudgetLimit();
    this.cdr.markForCheck();
  }

  private resolveVatProdPostingGroup(): string | null {
    const group = this.vatProdPostingGroups?.[0];
    if (!group) return null;
    const value = (group.stringId || group.description || '').toString().trim();
    return value || null;
  }

  private resolveUomSymbol(item?: any): string | null {
    const value = (
      item?.unitOfMeasurementSymbol ||
      item?.unitOfMeasurementCode ||
      this.selectedUomLabel ||
      ''
    ).toString().trim();
    return value || null;
  }

  private resetItemAndUomSelection(): void {
    this.itemForm.patchValue({ itemId: 0, unitOfMeasurementId: 0 }, { emitEvent: false });
    this.itemList = [];
    this.unitsOfMeasurementList = [];
    this.selectedUomLabel = '';
    this.itemForm.get('unitOfMeasurementId')?.disable({ emitEvent: false });
  }

  private mapDimensionDropdownItems(items: any[]): Array<{ id: number; description: string; stringId?: string }> {
    return (items || []).map((item: any) => ({
      id: Number(item.id ?? item.Id),
      description: item.description ?? item.Description,
      stringId: item.stringId ?? item.StringId ?? null
    }));
  }

  private resetDimensionSelection(): void {
    this.dimensionList = [];
    this.resetDimensionValueSelection();
    this.newPurchaseRequestForm.get('dimensionId')?.setValue(null, { emitEvent: false });
  }

  private resetDimensionValueSelection(): void {
    this.dimensionValueList = [];
    this.newPurchaseRequestForm.patchValue({
      dimensionValueId: null
    }, { emitEvent: false });
    this.setDimensionValueControlState(false);
  }

  private setDimensionValueControlState(locked: boolean): void {
    this.isDimensionValueLocked = locked;
    const ctrl = this.newPurchaseRequestForm.get('dimensionValueId');
    if (!ctrl) return;

    const shouldDisable = locked || this.viewMode || this.isSelectingFinalVendor;
    if (shouldDisable) {
      ctrl.disable({ emitEvent: false });
    } else {
      ctrl.enable({ emitEvent: false });
    }
  }

  private applyDimensionValues(values: any[], selectedDepartment?: string): void {
    this.dimensionValueList = this.mapDimensionDropdownItems(values);
    const ctrl = this.newPurchaseRequestForm.get('dimensionValueId');

    if (this.dimensionValueList.length === 1) {
      const only = this.dimensionValueList[0];
      ctrl?.setValue(only.id, { emitEvent: false });
      this.setDimensionValueControlState(true);
      this.cdr.markForCheck();
      return;
    }

    this.setDimensionValueControlState(false);

    const match = selectedDepartment
      ? this.dimensionValueList.find(value => this.dimensionValueMatches(value, selectedDepartment))
      : null;

    if (match) {
      ctrl?.setValue(match.id, { emitEvent: false });
    } else {
      ctrl?.setValue(null, { emitEvent: false });
    }
    this.cdr.markForCheck();
  }

  loadDimensionsForSelectedEntity(resetSelection = true): void {
    const entityId = Number(this.newPurchaseRequestForm.get('entityId')?.value);
    if (resetSelection) {
      this.resetDimensionSelection();
    } else {
      this.dimensionList = [];
      this.dimensionValueList = [];
    }

    if (!entityId) {
      return;
    }

    this.lookupService.getDimensionsByEntity(entityId).subscribe({
      next: (res) => {
        this.dimensionList = this.mapDimensionDropdownItems(res);
        if (!resetSelection) {
          this.restoreSelectedDimension();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load dimensions for entity:', err);
        this.dimensionList = [];
      }
    });
  }

  private restoreSelectedDimension(): void {
    const department = (this.newPurchaseRequestForm.get('department')?.value || '').toString().trim();
    const currentDimensionId = Number(this.newPurchaseRequestForm.get('dimensionId')?.value);

    const applyMatch = (dimensionId: number, values: any[]) => {
      this.newPurchaseRequestForm.get('dimensionId')?.setValue(dimensionId, { emitEvent: false });
      this.applyDimensionValues(values, department);
    };

    if (currentDimensionId && this.dimensionList.some(d => Number(d.id) === currentDimensionId)) {
      this.lookupService.getDimensionValuesByDimension(currentDimensionId).subscribe({
        next: (res) => applyMatch(currentDimensionId, res ?? []),
        error: (err) => console.error('Failed to restore dimension values:', err)
      });
      return;
    }

    if (!department || !this.dimensionList.length) {
      return;
    }

    forkJoin(
      this.dimensionList.map(d =>
        this.lookupService.getDimensionValuesByDimension(d.id).pipe(
          map(values => ({ dimensionId: d.id, values: values ?? [] })),
          catchError(() => of({ dimensionId: d.id, values: [] as any[] }))
        )
      )
    ).pipe(takeUntil(this.destroy$)).subscribe(results => {
      const match = results.find(result =>
        (result.values || []).some(value => this.dimensionValueMatches(value, department))
      );
      if (!match) {
        return;
      }

      applyMatch(match.dimensionId, match.values);
    });
  }

  private dimensionValueMatches(value: any, department: string): boolean {
    const target = department.trim().toLowerCase();
    if (!target) return false;

    return [
      value?.description,
      value?.Description,
      value?.stringId,
      value?.StringId
    ].some(candidate => (candidate ?? '').toString().trim().toLowerCase() === target);
  }

  onDimensionChanged(): void {
    this.resetDimensionValueSelection();

    const dimensionId = Number(this.newPurchaseRequestForm.get('dimensionId')?.value);
    if (!dimensionId || Number.isNaN(dimensionId)) {
      return;
    }

    this.lookupService.getDimensionValuesByDimension(dimensionId).subscribe({
      next: (res) => this.applyDimensionValues(res ?? []),
      error: (err) => {
        console.error('Failed to load dimension values:', err);
        this.resetDimensionValueSelection();
      }
    });
  }

  onDimensionValueChanged(): void {
  }

  onAddressSelect(id: any) {
    if (!id) {
      this.newPurchaseRequestForm.patchValue({
        country: '',
        city: '',
        region: '',
        address: '',
        address2: '',
        postCode: ''
      });
      return;
    }
    const selected = this.addresses?.find(a => a.id == id);
    if (!selected) return;

    this.newPurchaseRequestForm.patchValue({
      country: selected.country,
      city: selected.city,
      region: selected.region,
      address: selected.address,
      address2: selected.address2,
      postCode: selected.postCode
    });
  }

  loadUnitsOfMeasurements() {
    this.lookupService.getAllUnitsOfMeasurement().subscribe({
      next: (res) => {
        this.uomMasterList = res ?? [];
      },
      error: (err) => {
        console.error('Failed to load UoM dropdown:', err);
      }
    });
  }

  private resolveUnitOfMeasurementId(symbol: any): number | null {
    if (!symbol) return null;
    const code = (symbol.description || symbol.stringId || '').toString().trim().toLowerCase();
    const master = this.uomMasterList.find((u: any) => {
      const desc = (u.description || '').toString().trim().toLowerCase();
      const uomCode = (u.uomCode || u.code || '').toString().trim().toLowerCase();
      return (code && (desc === code || uomCode === code)) || (symbol.id && Number(u.id) === Number(symbol.id));
    });
    if (master?.id) return Number(master.id);
    if (symbol.id && this.uomMasterList.some((u: any) => Number(u.id) === Number(symbol.id))) {
      return Number(symbol.id);
    }
    return null;
  }

  loadAccounts() {
    this.lookupService.getAllAccounts().subscribe({
      next: (res) => {
        this.accountList = res ?? [];
        console.log('Account dropdown data:', this.accountList);
      },
      error: (err) => {
        console.error('Failed to load Account dropdown:', err);
      }
    });
  }

  private extractList(res: any): any[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.value?.result)) return res.value.result;
    if (Array.isArray(res?.value?.Result)) return res.value.Result;
    if (Array.isArray(res?.value)) return res.value;
    if (Array.isArray(res?.result)) return res.result;
    if (Array.isArray(res?.Result)) return res.Result;
    if (Array.isArray(res?.$values)) return res.$values;
    if (Array.isArray(res?.result?.$values)) return res.result.$values;
    if (Array.isArray(res?.value?.$values)) return res.value.$values;
    return [];
  }

  loadDepartments(): void {
    this.lookupService.getAllDepartments().subscribe({
      next: (res: any) => {
        const raw = this.extractList(res);
        this.departmentList = raw.map((d: any) => ({
          id: Number(d.id ?? d.Id),
          name: String(d.name ?? d.Name ?? '').trim(),
          description: d.description ?? d.Description ?? ''
        }));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load departments:', err);
        this.departmentList = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadProjects(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('User ID not found in localStorage');
      this.projectList = [];
      this.cdr.detectChanges();
      return;
    }

    this.projectService.getProjectsByUserId(userId).subscribe({
      next: (res: any) => {
        const raw = this.extractList(res);
        this.projectList = raw.map((p: any) => ({
          id: Number(p.id ?? p.Id),
          departmentId: Number(p.departmentId ?? p.DepartmentId),
          departmentName: p.departmentName ?? p.DepartmentName ?? '',
          name: String(p.name ?? p.Name ?? '').trim(),
          description: p.description ?? p.Description ?? '',
          activityCount: p.activityCount ?? p.ActivityCount ?? 0,
          projectActivities: (p.projectActivities || p.ProjectActivities || []).map((a: any) => ({
            id: Number(a.id ?? a.Id),
            projectId: Number(a.projectId ?? a.ProjectId ?? p.id ?? p.Id),
            name: String(a.name ?? a.Name ?? '').trim(),
            description: a.description ?? a.Description ?? '',
            budgetAmount: Number(a.budgetAmount ?? a.BudgetAmount ?? 0),
            allowedPercentage: Number(a.allowedPercentage ?? a.AllowedPercentage ?? 0),
            isException: !!(a.isException ?? a.IsException ?? false),
            reservedAmount: a.reservedAmount ?? a.ReservedAmount ?? null,
            consumedAmount: a.consumedAmount ?? a.ConsumedAmount ?? null
          }))
        }));
        this.filteredProjectList = this.projectList;
        if (this.newPurchaseItemData?.length) {
          this.newPurchaseItemData.forEach((item: any) => {
            if (item.projectActivityId) {
              if (item.activityBudgetAmount == null) {
                item.activityBudgetAmount = this.getActivityBudgetById(item.projectActivityId);
              }
              if (item.activityAllowedPercentage == null) {
                item.activityAllowedPercentage = this.getActivityAllowedPercentageById(item.projectActivityId);
              }
            }
          });
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load projects:', err);
        this.projectList = [];
        this.cdr.detectChanges();
      }
    });
  }

  onProjectChanged(): void {
    const projId = Number(this.itemForm.get('projectId')?.value);
    this.selectedProjectInfo = this.projectList.find(p => Number(p.id) === projId) || null;
    this.currentProjectActivities = this.selectedProjectInfo?.projectActivities || [];

    const currentActId = Number(this.itemForm.get('projectActivityId')?.value);
    if (!this.currentProjectActivities.some(a => Number(a.id) === currentActId)) {
      this.itemForm.patchValue({ projectActivityId: null }, { emitEvent: false });
      this.selectedActivityInfo = null;
    } else {
      this.selectedActivityInfo = this.currentProjectActivities.find(a => Number(a.id) === currentActId) || null;
    }

    if (projId) {
      this.fetchActivityBudgetUtilizationForProject(projId);
    }

    this.checkBudgetLimit();
    this.cdr.markForCheck();
  }

  fetchActivityBudgetUtilizationForProject(projId: number): void {
    if (!projId) return;
    const excludePrId = this.isNewForm ? null : (this.currentRequestId || null);
    this.purchaseRequestService.getActivityBudgetUtilization({ projectId: projId, excludePurchaseRequestId: excludePrId }).subscribe({
      next: (res: any) => {
        const utilizations: any[] = res?.$values ?? res ?? [];
        if (!Array.isArray(utilizations)) return;

        utilizations.forEach((u: any) => {
          const actId = Number(u.projectActivityId);
          const utilised = Number(u.utilisedBudget) || 0;
          const available = Number(u.availableBudget) || 0;
          const reserved = u.reservedAmount ?? u.ReservedAmount ?? null;
          const consumed = u.consumedAmount ?? u.ConsumedAmount ?? null;

          // Update in projectList
          for (const proj of this.projectList) {
            const found = (proj.projectActivities || []).find((a: any) => Number(a.id) === actId);
            if (found) {
              found.utilisedBudget = utilised;
              found.availableBudget = available;
              found.reservedAmount = reserved;
              found.consumedAmount = consumed;
            }
          }
          // Update in currentProjectActivities
          const act = this.currentProjectActivities.find((a: any) => Number(a.id) === actId);
          if (act) {
            act.utilisedBudget = utilised;
            act.availableBudget = available;
            act.reservedAmount = reserved;
            act.consumedAmount = consumed;
          }
          // Update in selectedActivityInfo
          if (this.selectedActivityInfo && Number(this.selectedActivityInfo.id) === actId) {
            this.selectedActivityInfo.utilisedBudget = utilised;
            this.selectedActivityInfo.availableBudget = available;
            this.selectedActivityInfo.reservedAmount = reserved;
            this.selectedActivityInfo.consumedAmount = consumed;
          }
        });

        this.checkBudgetLimit();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to fetch activity budget utilization:', err)
    });
  }

  onProjectActivityChanged(): void {
    const actId = Number(this.itemForm.get('projectActivityId')?.value);
    this.selectedActivityInfo = this.currentProjectActivities.find(a => Number(a.id) === actId) || null;
    this.checkBudgetLimit();
    this.cdr.markForCheck();
  }

  get isWaiveAmountActive(): boolean {
    const hasExceptionPolicy = !!this.newPurchaseRequestForm?.get('exceptionPolicy')?.value;
    return hasExceptionPolicy && !!this.exceptionPolicyData?.waiveAmount;
  }

  get isInsertDisabled(): boolean {
    if (this.viewMode) return true;
    if (this.isSelectingFinalVendor && this.editingRowIndex === null) return true;
    return false;
  }

  checkBudgetLimit(): void {
    const actId = this.itemForm.get('projectActivityId')?.value ? Number(this.itemForm.get('projectActivityId')?.value) : null;
    if (actId) {
      if (!this.selectedActivityInfo || Number(this.selectedActivityInfo.id) !== actId) {
        this.selectedActivityInfo = this.currentProjectActivities?.find(a => Number(a.id) === actId) || null;
        if (!this.selectedActivityInfo) {
          for (const p of this.projectList) {
            const found = (p.projectActivities || []).find(a => Number(a.id) === actId);
            if (found) {
              this.selectedActivityInfo = found;
              if (!this.selectedProjectInfo) this.selectedProjectInfo = p;
              break;
            }
          }
        }
      }
    } else {
      this.selectedActivityInfo = null;
    }

    const budgetInfo = this.getActivityRemainingBudget();
    if (!budgetInfo || budgetInfo.baseBudget <= 0) {
      this.isBudgetExceeded = false;
      this.budgetWarningType = 'none';
      this.budgetExceededMessage = '';
      this.cdr.detectChanges();
      return;
    }

    if (budgetInfo.status === 'exceeded') {
      const isException = !!this.selectedActivityInfo?.isException;
      if (isException) {
        this.isBudgetExceeded = false;
        this.budgetWarningType = 'orange';
        this.budgetExceededMessage = '';
      } else {
        this.isBudgetExceeded = true;
        this.budgetWarningType = 'danger';
        const formattedTotal = budgetInfo.usedBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedMax = budgetInfo.maxAllowedBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedExceeded = budgetInfo.exceededBy.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        this.budgetExceededMessage = `You've exceeded the budget + budget tolerance% (${budgetInfo.allowedPercentage}%) by ${formattedExceeded}. Total: ${formattedTotal}, Max Allowed: ${formattedMax}.`;
      }
    } else if (budgetInfo.status === 'exhausted') {
      this.isBudgetExceeded = false;
      this.budgetWarningType = 'warning';
      this.budgetExceededMessage = "You've used all the budget including allowed amount. (Available: 0.00)";
    } else if (budgetInfo.status === 'buffer') {
      this.isBudgetExceeded = false;
      this.budgetWarningType = 'warning';
      const formattedAvail = budgetInfo.availableAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      this.budgetExceededMessage = `Allocated budget reached. Using allowed ${budgetInfo.allowedPercentage}% buffer. Available remaining: ${formattedAvail}.`;
    } else {
      this.isBudgetExceeded = false;
      this.budgetWarningType = 'none';
      this.budgetExceededMessage = '';
    }

    this.cdr.detectChanges();
  }

  getActivityRemainingBudget(): {
    baseBudget: number;
    allowedPercentage: number;
    allowedAmount: number;
    maxAllowedBudget: number;
    usedBudget: number;
    availableAmount: number;
    exceededBy: number;
    status: 'normal' | 'buffer' | 'exhausted' | 'exceeded';
  } | null {
    if (!this.selectedActivityInfo) return null;
    const currentActivityId = Number(this.selectedActivityInfo.id);
    const baseBudget = Number(this.selectedActivityInfo.budgetAmount) || 0;
    const allowedPercentage = Number(this.selectedActivityInfo.allowedPercentage) || 0;
    const allowedAmount = baseBudget * (allowedPercentage / 100);
    const maxAllowedBudget = baseBudget + allowedAmount;

    // Database utilised budget from existing PRs
    const dbUtilised = Number(this.selectedActivityInfo.utilisedBudget) || 0;

    let previousUsedInCurrentPr = 0;
    this.newPurchaseItemData.forEach((item: any, idx: number) => {
      if (idx !== this.editingRowIndex && Number(item.projectActivityId) === currentActivityId) {
        previousUsedInCurrentPr += Number(item.amount) || 0;
      }
    });

    const currentFormAmount = Number(this.itemForm.get('amount')?.value) || 0;
    const totalUsed = dbUtilised + previousUsedInCurrentPr + currentFormAmount;

    let status: 'normal' | 'buffer' | 'exhausted' | 'exceeded' = 'normal';
    let availableAmount = 0;
    let exceededBy = 0;

    const baseDiff = Math.round((baseBudget - totalUsed) * 100) / 100;
    const maxDiff = Math.round((maxAllowedBudget - totalUsed) * 100) / 100;

    if (totalUsed <= baseBudget) {
      status = 'normal';
      availableAmount = maxDiff;
    } else if (totalUsed > baseBudget && maxDiff > 0) {
      status = 'buffer';
      availableAmount = maxDiff;
    } else if (maxDiff === 0) {
      status = 'exhausted';
      availableAmount = 0;
    } else {
      status = 'exceeded';
      availableAmount = 0;
      exceededBy = Math.round((totalUsed - maxAllowedBudget) * 100) / 100;
    }

    return {
      baseBudget,
      allowedPercentage,
      allowedAmount,
      maxAllowedBudget,
      usedBudget: totalUsed,
      availableAmount,
      exceededBy,
      status
    };
  }

  getActivityById(id: any): ProjectActivityItem | null {
    if (!id) return null;
    const numId = Number(id);
    for (const p of this.projectList) {
      const act = (p.projectActivities || []).find(a => Number(a.id) === numId);
      if (act) return act;
    }
    return null;
  }

  getActivityBudgetById(id: any): number | null {
    const act = this.getActivityById(id);
    return act?.budgetAmount != null ? Number(act.budgetAmount) : null;
  }

  getActivityAllowedPercentageById(id: any): number | null {
    const act = this.getActivityById(id);
    return act?.allowedPercentage != null ? Number(act.allowedPercentage) : null;
  }

  isRowExceededAllowed(row: any): boolean {
    const actId = row.projectActivityId ? Number(row.projectActivityId) : null;
    if (!actId) return false;

    const baseBudget = row.activityBudgetAmount != null
      ? Number(row.activityBudgetAmount)
      : (this.getActivityBudgetById(actId) || 0);

    if (baseBudget <= 0) return false;

    const allowedPct = row.activityAllowedPercentage != null
      ? Number(row.activityAllowedPercentage)
      : (this.getActivityAllowedPercentageById(actId) || 0);

    const maxAllowed = baseBudget + (baseBudget * (allowedPct / 100));

    const act = this.getActivityById(actId);
    const dbUtilised = act?.utilisedBudget != null ? Number(act.utilisedBudget) : 0;

    let totalForActivity = dbUtilised;
    for (const item of this.newPurchaseItemData) {
      if (Number(item.projectActivityId) === actId) {
        totalForActivity += Number(item.amount) || 0;
      }
    }

    return (totalForActivity - maxAllowed) > 0.009;
  }

  calculateExceededBudgetAmounts(): void {
    // Group items by activity
    const activityGroups: { [key: number]: any[] } = {};

    this.newPurchaseItemData.forEach((item, index) => {
      if (item.projectActivityId) {
        const actId = Number(item.projectActivityId);
        if (!activityGroups[actId]) {
          activityGroups[actId] = [];
        }
        activityGroups[actId].push({ ...item, originalIndex: index });
      }
    });

    // Calculate exceeded amount for each item
    Object.keys(activityGroups).forEach(actId => {
      const activityItems = activityGroups[Number(actId)];
      const act = this.getActivityById(Number(actId));

      if (!act) return;

      const budgetAmount = act.budgetAmount != null ? Number(act.budgetAmount) : 0;
      const allowedPercentage = act.allowedPercentage != null ? Number(act.allowedPercentage) : 0;
      const maxAllowed = budgetAmount + (budgetAmount * (allowedPercentage / 100));
      const existingUtilised = act.utilisedBudget != null ? Number(act.utilisedBudget) : 0;

      // Sort by index to maintain order
      activityItems.sort((a, b) => a.originalIndex - b.originalIndex);

      let runningTotal = existingUtilised;
      activityItems.forEach(item => {
        const amount = Number(item.amount) || 0;
        const availableBefore = maxAllowed - runningTotal;
        runningTotal += amount;

        // Exceeded amount is how much THIS ITEM exceeds the available budget
        const exceededAmount = Math.max(0, amount - availableBefore);
        this.newPurchaseItemData[item.originalIndex].exceededBudgetAmount = exceededAmount > 0 ? exceededAmount : null;
      });
    });
  }

  getProjectNameById(id: any): string {
    if (!id) return '';
    const p = this.projectList.find(x => Number(x.id) === Number(id));
    return p ? p.name : '';
  }

  getActivityNameById(id: any): string {
    if (!id) return '';
    for (const p of this.projectList) {
      const act = (p.projectActivities || []).find(a => Number(a.id) === Number(id));
      if (act) return act.name;
    }
    return '';
  }

  isDepartmentNotInList(val: string | null): boolean {
    if (!val) return false;
    return !this.departmentList.some(d => d.name === val);
  }

  get displayedDepartmentList(): Array<{ id: number; name: string; description?: string }> {
    const val = this.newPurchaseRequestForm?.get('department')?.value;
    if (val && !this.departmentList?.some(d => d.name === val)) {
      return [{ id: -1, name: val, description: '' }, ...(this.departmentList || [])];
    }
    return this.departmentList || [];
  }

  loadItems() {
    this.lookupService.getAllItems().subscribe({
      next: (res) => {
        this.itemList = res ?? [];
        console.log('Item dropdown data:', this.itemList);
      },
      error: (err) => {
        console.error('Failed to load items dropdown:', err);
      }
    });
  }

  onWorkflowTypeChange(selectedId: number): void {
    if (selectedId) {
      this.GetWorkflowMasterByTypeId(selectedId);
    }
  }

  GetWorkflowMasterByTypeId(id: number): void {
    this.WorkflowServiceService.GetWorkflowMasterByTypeId(id).subscribe({
      next: (data: any) => {
        // Fix: Extract $values if it exists
        this.workflowList = data.$values ?? data;
      },
      error: (err) => {
        console.error("Error fetching workflow master list:", err);
      }
    });
  }

  getWorkflowTypes(): void {
    this.WorkflowServiceService.getWorkflowTypes().subscribe({
      next: (data: any) => {
        // Fix: Extract $values if it exists
        this.workflowTypes = data.$values ?? data;
      },
      error: (err) => {
        console.error("Error fetching workflow types:", err);
      }
    });
  }

  getVendorNameById(id: string): string {
    const found = this.finalVendors.find(v => v.vendorId === id);
    return found ? found.vendorName : '';
  }

  toDateInputValue(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // correct format for input[type="date"]
  }

  getUomCodeById(id: number): string {
    const found = this.uomMasterList.find(u => u.id === id) || this.unitsOfMeasurementList.find(u => u.id === id);
    return found ? found.description : '';
  }

  getAccountNameById(id: number): string {
    const found = this.accountList.find(a => a.id === id);
    return found ? found.description : '';
  }
  getItemNameById(id: number): string {
    const found = this.itemList.find(i => i.id === id);
    return found ? found.description : '';
  }

  // insertItem(): void {
  //   const newItem = this.itemForm.value;
  //   const newItemId = Number(newItem.itemId);

  //   // Duplicate check — works for add and edit both
  //   const duplicate = this.newPurchaseItemData.some((item, index) =>
  //     index !== this.editingRowIndex && Number(item.itemId) === newItemId
  //   );

  //   if (duplicate) {
  //     this.toastr.warning('This item is already added. You can update it instead.');
  //     return;
  //   }

  //   if (this.editingRowIndex !== null) {
  //     const existing = this.newPurchaseItemData[this.editingRowIndex];
  //     const merged = {
  //       ...existing,
  //       ...newItem,
  //       itemId: newItemId,
  //       attachments: existing?.attachments ?? []
  //     };

  //     // Immutable update to trigger ngx-datatable refresh
  //     this.newPurchaseItemData = this.newPurchaseItemData.map((item, idx) =>
  //       idx === this.editingRowIndex ? merged : item
  //     );

  //     this.toastr.success('Item updated successfully!');
  //     this.editingRowIndex = null;

  //   } else {
  //     // Add new
  //     const withEmptyAttachments = {
  //       ...newItem,
  //       itemId: newItemId,
  //       attachments: newItem.attachments?.length ? newItem.attachments : []
  //     };
  //     this.newPurchaseItemData = [...this.newPurchaseItemData, withEmptyAttachments];
  //     this.toastr.success('Item added successfully!');
  //   }

  //   this.itemForm.reset({
  //     amount: 0,
  //     unitCost: 0,
  //     orderQuantity: 1
  //   });
  // }

  insertItem(): void {
    this.checkBudgetLimit();

    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      this.toastr.warning('Please fill all required fields before inserting.');
      return;
    }

    const newItem = this.itemForm.getRawValue();
    const itemId = Number(newItem.itemId);
    const orderQuantity = Number(newItem.orderQuantity);
    const amount = Number(newItem.amount);

    if (this.filteredProjectList.length > 0 && !this.itemForm.get('projectId')?.value) {
      this.itemForm.get('projectId')?.markAsTouched();
      this.toastr.warning('Please select a Project before adding item.');
      return;
    }

    if (this.currentProjectActivities.length > 0 && !this.itemForm.get('projectActivityId')?.value) {
      this.itemForm.get('projectActivityId')?.markAsTouched();
      this.toastr.warning('Please select a Project Activity before adding item.');
      return;
    }

    if (!itemId || Number.isNaN(itemId) || itemId <= 0) {
      this.itemForm.get('itemId')?.markAsTouched();
      this.toastr.warning('Please select Item before adding item.');
      return;
    }

    if (!newItem.orderQuantity || Number.isNaN(orderQuantity) || orderQuantity <= 0) {
      this.itemForm.get('orderQuantity')?.markAsTouched();
      this.toastr.warning('Please enter Order Quantity greater than 0 before adding item.');
      return;
    }

    if (newItem.amount === null || newItem.amount === '' || Number.isNaN(amount) || amount <= 0) {
      this.itemForm.get('amount')?.markAsTouched();
      this.toastr.warning('Please enter Budget Amount greater than 0 before adding item.');
      return;
    }

    // const derivedUnitCost = orderQuantity > 0 ? amount / orderQuantity : 0;
    const newItemId = Number(newItem.itemId);
    const projectId = this.itemForm.get('projectId')?.value ? Number(this.itemForm.get('projectId')?.value) : null;
    const projectActivityId = this.itemForm.get('projectActivityId')?.value ? Number(this.itemForm.get('projectActivityId')?.value) : null;
    const selectedItem = this.itemList?.find(i => Number(i.id) === newItemId);
    const unitCost = Number(newItem.unitCost) || Number(selectedItem?.unitPrice) || 0;
    const activityBudget = this.selectedActivityInfo?.budgetAmount != null
      ? Number(this.selectedActivityInfo.budgetAmount)
      : this.getActivityBudgetById(projectActivityId);
    const activityAllowedPct = this.selectedActivityInfo?.allowedPercentage != null
      ? Number(this.selectedActivityInfo.allowedPercentage)
      : this.getActivityAllowedPercentageById(projectActivityId);

    const normalizedItem = {
      ...newItem,
      amount,
      unitCost,
      projectId,
      projectActivityId,
      projectName: this.selectedProjectInfo?.name || this.getProjectNameById(projectId),
      projectActivityName: this.selectedActivityInfo?.name || this.getActivityNameById(projectActivityId),
      activityBudgetAmount: activityBudget,
      activityAllowedPercentage: activityAllowedPct
    };

    // ── Exception-activity budget gate ─────────────────────────────────────
    // If the selected activity is NOT an exception activity and the budget
    // status is 'exceeded' (i.e. beyond budget + tolerance %), block insert.
    if (
      this.selectedActivityInfo &&
      !this.selectedActivityInfo.isException &&
      this.budgetWarningType === 'danger'
    ) {
      const budgetInfo = this.getActivityRemainingBudget();
      const exceeded = budgetInfo?.exceededBy?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00';
      const maxAllowed = budgetInfo?.maxAllowedBudget?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00';
      const tolerance = budgetInfo?.allowedPercentage ?? this.selectedActivityInfo.allowedPercentage ?? 0;
      const activityName = this.selectedActivityInfo.name || 'Selected Activity';
      const actionText = this.editingRowIndex !== null ? 'update' : 'insert';

      Swal.fire({
        html: `
          <div class="modern-budget-modal">
            <!-- Modern Icon Header with soft ambient ring -->
            <div style="display: flex; justify-content: center; margin-bottom: 16px;">
              <div style="position: relative; width: 68px; height: 68px; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; inset: 0; border-radius: 50%; background: #fee2e2; opacity: 0.6; transform: scale(1.15);"></div>
                <div style="position: relative; width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #fecaca; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.18);">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Title & Subtitle -->
            <h4 style="font-size: 1.3rem; font-weight: 700; color: #1e293b; margin: 0 0 8px 0; letter-spacing: -0.01em;">
              Budget Limit Exceeded
            </h4>
            <p style="font-size: 0.88rem; color: #64748b; line-height: 1.5; margin: 0 auto 18px auto; max-width: 410px;">
              You cannot ${actionText} this item because the budget for activity
              <strong style="color: #0f172a; background: #f1f5f9; padding: 2px 8px; border-radius: 6px; border: 1px solid #e2e8f0; display: inline-block;">
                ${activityName}
              </strong>
              has been exceeded.
            </p>

            <!-- Financial Metrics Split Cards -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px; text-align: left;">
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px;">
                <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 4px;">
                  Max Allowed Budget
                </div>
                <div style="font-size: 1.18rem; font-weight: 700; color: #1e293b; line-height: 1.2;">
                  ${maxAllowed}
                </div>
                <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 3px;">
                  Includes ${tolerance}% tolerance
                </div>
              </div>

              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 14px;">
                <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #b91c1c; letter-spacing: 0.5px; margin-bottom: 4px;">
                  Exceeded By
                </div>
                <div style="font-size: 1.18rem; font-weight: 700; color: #dc2626; line-height: 1.2;">
                  +${exceeded}
                </div>
                <div style="font-size: 0.72rem; color: #ef4444; margin-top: 3px;">
                  Over allowed limit
                </div>
              </div>
            </div>

            <!-- Resolution Guidance Box -->
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 12px 14px; text-align: left;">
              <div style="font-size: 0.76rem; font-weight: 700; text-transform: uppercase; color: #92400e; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2.3" style="margin-right: 6px; flex-shrink: 0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                How to Proceed
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: flex-start; font-size: 0.83rem; color: #78350f; line-height: 1.45;">
                  <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; border-radius: 50%; background: #fef3c7; border: 1px solid #fcd34d; color: #92400e; font-weight: 700; font-size: 0.7rem; margin-right: 8px; margin-top: 1px; flex-shrink: 0;">1</span>
                  <span>Select a Project Activity marked <span style="background: #10b981; color: #ffffff; padding: 1px 7px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; display: inline-block; vertical-align: middle;">Exception</span> from the Project Activity dropdown.</span>
                </div>
                <div style="display: flex; align-items: flex-start; font-size: 0.83rem; color: #78350f; line-height: 1.45;">
                  <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; border-radius: 50%; background: #fef3c7; border: 1px solid #fcd34d; color: #92400e; font-weight: 700; font-size: 0.7rem; margin-right: 8px; margin-top: 1px; flex-shrink: 0;">2</span>
                  <span>Or ask a project administrator to mark an Exception Activity for this project.</span>
                </div>
              </div>
            </div>
          </div>
        `,
        confirmButtonText: 'OK, I understand',
        buttonsStyling: false,
        showCloseButton: true,
        customClass: {
          popup: 'modern-budget-limit-popup',
          confirmButton: 'modern-budget-confirm-btn'
        },
        width: 500
      });
      return;
    }
    // ── End exception-activity budget gate ─────────────────────────────────

    // Duplicate check — works for add and edit both
    const duplicate = this.newPurchaseItemData.some((item, index) =>
      index !== this.editingRowIndex && Number(item.itemId) === newItemId
    );

    if (duplicate) {
      this.toastr.warning('This item is already added. You can update it instead.');
      return;
    }

    if (this.editingRowIndex !== null) {
      //  Edit mode: update the selected row (manual or bulk)
      const existing = this.newPurchaseItemData[this.editingRowIndex];
      const merged = {
        ...existing,
        ...normalizedItem,
        itemId: existing.itemId,
        vatProdPostingGroup: existing.vatProdPostingGroup || this.resolveVatProdPostingGroup(),
        unitOfMeasurementSymbol: this.selectedUomLabel || this.resolveUomSymbol(normalizedItem) || this.resolveUomSymbol(existing),
        attachments: existing?.attachments ?? []
      };

      this.newPurchaseItemData = this.newPurchaseItemData.map((item, idx) =>
        idx === this.editingRowIndex ? merged : item
      );

      this.calculateExceededBudgetAmounts();
      this.toastr.success('Item updated successfully!');
      this.editingRowIndex = null;
    } else {
      //  Always append a new manual row (no duplicate restriction)
      const withEmptyAttachments = {
        ...normalizedItem,
        itemId: newItemId,
        vatProdPostingGroup: this.resolveVatProdPostingGroup(),
        unitOfMeasurementSymbol: this.resolveUomSymbol(normalizedItem),
        attachments: newItem.attachments?.length ? newItem.attachments : []
      };

      this.newPurchaseItemData = [...this.newPurchaseItemData, withEmptyAttachments];
      this.calculateExceededBudgetAmounts();
      this.toastr.success('Item added successfully!');
    }

    // Reset form after add/update
    this.clearItemForm();
  }

  // Edit a row
  editRow(row: any, rowIndex: number) {
    this.isPatchingRow = true;
    // mark which row is being edited
    this.editingRowIndex = rowIndex;

    const projId = row.projectId ? Number(row.projectId) : null;
    const actId = row.projectActivityId ? Number(row.projectActivityId) : null;

    if (projId) {
      this.selectedProjectInfo = this.projectList.find(p => Number(p.id) === projId) || null;
      this.currentProjectActivities = this.selectedProjectInfo?.projectActivities || [];
      if (actId) {
        this.selectedActivityInfo = this.currentProjectActivities.find(a => Number(a.id) === actId) || null;
      } else {
        this.selectedActivityInfo = null;
      }
      this.fetchActivityBudgetUtilizationForProject(projId);
    } else {
      this.selectedProjectInfo = null;
      this.currentProjectActivities = [];
      this.selectedActivityInfo = null;
    }

    // patch form values from the selected row
    this.itemForm.patchValue({
      id: row.id || null,
      itemType: row.itemType || '',
      projectId: projId,
      projectActivityId: actId,
      itemId: Number(row.itemId) || null,
      unitOfMeasurementId: Number(row.unitOfMeasurementId) || null,
      orderQuantity: Number(row.orderQuantity) || 0,
      unitCost: Number(row.unitCost) || 0,
      amount: Number(row.amount) || 0,
      reqByDate: row.reqByDate ? this.toDateInputValue(row.reqByDate) : this.toDateInputValue(new Date()),
      itemDescription: row.itemDescription || '',
      vendorUserId: row.vendorUserId || null,
      vendorCompanyId: row.vendorCompanyId || null,
      accountId: Number(row.accountId) || 1,
      remarks: row.remarks || '',
      attachments: row.attachments || []
    });
    this.selectedUomLabel = this.resolveUomSymbol(row) || '';
    this.checkBudgetLimit();
    this.syncFinalVendorControlState();
    this.isPatchingRow = false;

    // if vendor changes, refresh vendor company list
    if (row.vendorUserId) {
      this.onVendorChange(row.vendorUserId);
    }

    // ensure vendor company dropdown syncs after async data
    Promise.resolve().then(() => {
      this.itemForm.patchValue(
        { vendorCompanyId: row.vendorCompanyId || null },
        { emitEvent: false }
      );
    });
  }

  deleteRow(rowIndex: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this item?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        const isEditingDeletedRow = this.editingRowIndex === rowIndex;
        const deletedRow = this.newPurchaseItemData[rowIndex];
        const isSelectedDeletedRow =
          this.selectedRow && deletedRow && Number(this.selectedRow.itemId) === Number(deletedRow.itemId);

        this.newPurchaseItemData.splice(rowIndex, 1);
        this.newPurchaseItemData = [...this.newPurchaseItemData];

        // Recalculate exceeded amounts after deletion
        this.calculateExceededBudgetAmounts();

        if (isEditingDeletedRow) {
          this.itemForm.reset({
            amount: 0,
            unitCost: 0,
            orderQuantity: 0,
            accountId: 1,
            itemType: 'Inventory',
            projectId: null,
            projectActivityId: null,
            reqByDate: this.toDateInputValue(new Date())
          });
          this.selectedProjectInfo = null;
          this.selectedActivityInfo = null;
          this.currentProjectActivities = [];
          this.editingRowIndex = null;
        }
        this.checkBudgetLimit();
        this.syncFinalVendorControlState();

        if (isSelectedDeletedRow) {
          this.selectedRow = null;
        }

        this.toastr.success('Item deleted!', '');
      }
    });
  }

  loadExistingRequest(id: number, generateRfq?: boolean, forInventoryTransfer?: boolean, selectFinalVendor?: boolean) {

    this.spinner.show();

    this.loading = true;

    this.purchaseRequestService.getPurchaseRequestById(id, generateRfq, forInventoryTransfer, selectFinalVendor).subscribe({

      next: async (data) => {

        // unwrap the Ardalis.Result<T> wrapper (if any)
        const requestData = data;
        
        if (id) {
          this.purchaseRequestService.getPrItemStatusCount(id).subscribe({
            next: (res) => {
              this.itemStatusCountData = res;
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('Failed to load PR Item Status Count:', err);
            }
          });
        }

        const loggedInUserId = localStorage.getItem('userId');
        this.isSubmitter = requestData.submitterId === loggedInUserId;
        this.isMainApprover = requestData.mainApproverId === loggedInUserId;
        this.isNewForm = false;
        this.currentRequestId = requestData.id;
        this.currentRequisitionNo = requestData.requisitionNo;

        this.newPurchaseRequestForm.patchValue({
          ...requestData,
          department: requestData.department || null,
          submittedDate: this.toDateInputValue(requestData.submittedDate)
        });

        this.patchReceiverContactFromE164(requestData.receiverContact);

        if (requestData.requestStatus) {
          this.newPurchaseRequestForm.patchValue({
            status: requestData.requestStatus
          });

          if (requestData.requestStatus === 'Completed') {
            this.isStatusCompleted = true;
            this.cdr.detectChanges();
          } else {
            this.isStatusCompleted = false;
            this.cdr.detectChanges();
          }

          if (requestData.requestStatus === 'Rejected') {
            this.isStatusRejected = true;
            this.cdr.detectChanges();
          } else {
            this.isStatusRejected = false;
            this.cdr.detectChanges();
          }

          if (requestData.requestStatus === 'InProgress') {
            this.isStatusInProgress = true;
            this.cdr.detectChanges();
          } else {
            this.isStatusInProgress = false;
            this.cdr.detectChanges();
          }

          if (requestData.requestStatus === 'Draft') {
            this.isStatusDraft = true;
            this.cdr.detectChanges();
          } else {
            this.isStatusDraft = false;
            this.cdr.detectChanges();
          }
        }

        if (requestData.purchaseItems) {
          const itemList = requestData.purchaseItems || [];

          this.newPurchaseItemData = itemList.map((item: any) => ({
            id: item.id,
            requisitionNo: item.requisitionNo,
            itemType: item.itemType,
            itemId: item.itemId,
            itemDescription: item.itemDescription,
            amount: item.amount,
            unitCost: item.unitCost,
            unitOfMeasurementId: item.unitOfMeasurementId,
            unitOfMeasurementSymbol: this.resolveUomSymbol(item),
            orderQuantity: item.orderQuantity,
            reqByDate: this.toDateInputValue(item.reqByDate),
            vendorUserId: item.vendorUserId,
            vendorCompanyId: item.vendorCompanyId,
            accountId: item.accountId,
            remarks: item.remarks,
            vatProdPostingGroup: item.vatProdPostingGroup || this.resolveVatProdPostingGroup(),
            createdBy: item.createdBy,
            purchaseRequestId: item.purchaseRequestId,
            isPoCreated: item.isPoCreated,
            isPoRequested: item.isPoRequested,
            isRfqCreated: item.isRfqCreated,
            isInventoryTransfer: item.isInventoryTransfer,
            projectId: item.projectId || null,
            projectName: item.projectName || this.getProjectNameById(item.projectId),
            projectActivityId: item.projectActivityId || null,
            projectActivityName: item.projectActivityName || this.getActivityNameById(item.projectActivityId),
            activityBudgetAmount: this.getActivityBudgetById(item.projectActivityId),
            activityAllowedPercentage: this.getActivityAllowedPercentageById(item.projectActivityId),
            exceededBudgetAmount: item.exceededBudgetAmount || null,
            departmentId: item.departmentId || null,
            attachments: (item.attachments || []).map((a: any) => ({
              id: a.id,
              content: a.content || '',
              contentType: a.contentType || '',
              fileName: a.fileName || '',
              fromForm: a.fromForm || '',
              createdDate: a.createdDate,
              modifiedDate: a.modifiedDate,
              createdBy: a.createdBy || 'current-user',
              isDeleted: a.isDeleted || false,
              purchaseItemId: a.purchaseItemId || 0,
              isNew: false
            }))
          }));
        }
        console.log('list item data:', this.newPurchaseItemData);
        this.exceptionPolicyData = requestData.prExceptionPolicy ?? null;
        this.showExceptionPolicyView = !!this.exceptionPolicyData && !!this.newPurchaseRequestForm.get('exceptionPolicy')?.value;

        const prEntityId = Number(requestData.entityId) || null;
        // Pass prEntityId twice: once as prId for control state, once for direct loading bypass
        this.applyEntity(prEntityId, prEntityId);

        const uniqueProjectIds = Array.from(new Set(
          (this.newPurchaseItemData || []).map(i => Number(i.projectId)).filter(id => id > 0)
        ));
        uniqueProjectIds.forEach(pId => this.fetchActivityBudgetUtilizationForProject(pId));

        // Don't recalculate exceeded amounts for existing PRs - use stored values from DB
        // Only recalculate when in create mode or when user modifies items
        if (this.isNewForm) {
          this.calculateExceededBudgetAmounts();
        }

        this.loading = false;
        this.spinner.hide();
        this.cdr.detectChanges();
      },

      error: (err) => {
        this.spinner.hide();
        this.loading = false;
        console.error('Failed to load purchase request:', err);
      }
    });
  }


  homePage() {
    if (this.isNewForm && this.isFormDirty) {
      Swal.fire({
        title: 'Save as Draft?',
        text: 'Do you want to save this request as a draft?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, save it',
        cancelButtonText: 'No, go back',
      }).then((result) => {
        if (result.isConfirmed) {
          this.saveAsDraftAndGoBack();
        } else {
          this.router.navigate(['/purchase-request']);
        }
      });
    } else {
      this.router.navigate(['/purchase-request']);
    }
  }

  saveAsDraftAndGoBack() {
    // if (this.newPurchaseRequestForm.invalid) {
    //   return;
    // }

    const f = this.newPurchaseRequestForm.getRawValue();
    const submittedDateISO = f.date ? new Date(f.submittedDate).toISOString() : new Date().toISOString();
    const entityId = Number(localStorage.getItem('selectedCompanyId'));

    const lsEntity = localStorage.getItem('selectedCompanyId');
    const finalEntityId = lsEntity === 'All' ? Number(f.entityId) : Number(lsEntity);

    if (lsEntity === 'All' && !finalEntityId) {
      this.toastr.info('Please select an Entity.');
      return;
    }

    const matchedDraftDept = this.departmentList.find(d =>
      d.id === Number(f.department) ||
      (d.name && f.department && d.name.trim().toLowerCase() === String(f.department).trim().toLowerCase())
    );
    const draftDepartmentId = matchedDraftDept ? matchedDraftDept.id : (Number(f.department) || null);

    const purchaseItems = this.newPurchaseItemData?.length
      ? this.newPurchaseItemData.map(item => ({
        id: item.id || null,
        itemType: item.itemType || '',
        itemId: Number(item.itemId) || 0,
        unitOfMeasurementId: Number(item.unitOfMeasurementId) || null,
        amount: item.amount || 0,
        unitCost: item.unitCost || 0,
        orderQuantity: item.orderQuantity || 0,
        reqByDate: item.reqByDate || new Date(),
        itemDescription: item.itemDescription || '',
        accountId: Number(item.accountId) || 1,
        remarks: item.remarks || '',
        createdBy: item.createdBy || '',
        purchaseRequestId: item.purchaseRequestId || 0,
        vendorUserId: item.vendorUserId || null,
        vendorCompanyId: item.vendorCompanyId || null,
        vatProdPostingGroup: item.vatProdPostingGroup || this.resolveVatProdPostingGroup(),
        unitOfMeasurementSymbol: this.resolveUomSymbol(item),
        projectId: item.projectId ? Number(item.projectId) : null,
        projectActivityId: item.projectActivityId ? Number(item.projectActivityId) : null,
        departmentId: item.departmentId ? Number(item.departmentId) : draftDepartmentId,
        requisitionNo: f.requisitionNo,
        attachments: item.attachments?.map(att => ({

          id: att.id || null,
          content: att.content || '',
          contentType: att.contentType || '',
          fileName: att.fileName || '',
          fromForm: att.fromForm || '',
          createdBy: 'current-user',
          isDeleted: false,
          purchaseItemId: att.purchaseItemId || 0,
        }))
      }))
      : [];

    const payload = {
      id: this.currentRequestId || null,
      requisitionNo: f.requisitionNo || '',
      submittedDate: f.submittedDate || null,
      deliveryLocation: f.deliveryLocation || '',
      receiverName: f.receiverName || '',
      receiverContact: this.normalizePhoneToString(f.receiverContact),
      status: 'Draft',
      requestStatus: 'Draft',
      department: f.department || '',
      departmentId: draftDepartmentId,
      designation: f.designation || '',
      businessUnit: f.businessUnit || '',
      partialDeliveryAcceptable: f.partialDeliveryAcceptable || false,
      exceptionPolicy: f.exceptionPolicy || false,
      exceptionPolicyDetails: f.exceptionPolicy ? this.exceptionPolicyData : null,
      subject: f.subject || '',
      workflowMasterId: Number(f.workflowMasterId) || 0,
      createdBy: f.createdBy || '',
      entityId: finalEntityId,
      addressId: f.addressId,
      purchaseItems
    };

    this.loading = true;
    this.spinner.show();

    const request$ =
      this.currentRequestId
        ? this.purchaseRequestService.updatePurchaseRequest(this.currentRequestId, {
          purchaseRequest: payload,
          isDraft: true
        })
        : this.purchaseRequestService.createPurchaseRequest({ purchaseRequest: payload, isDraft: true });

    request$.subscribe({
      next: () => this.handleDraftSuccess(),
      error: (err) => this.handleDraftError(err)
    });
  }

  private handleDraftSuccess() {

    this.loading = false;
    this.spinner.hide();
    // this.toastr.success('Draft saved successfully');
    this.router.navigate(['/purchase-request']);
  }

  private handleDraftError(err: any) {
    this.loading = false;
    this.spinner.hide();
    this.toastr.error('Failed to save draft');
    console.error('Error saving draft:', err);
  }

  submitForm() {
    if (!this.newPurchaseRequestForm.valid) {
      this.newPurchaseRequestForm.markAllAsTouched();
      if (this.newPurchaseRequestForm.get('entityId')?.hasError('required')) {
        this.toastr.warning('Please select an Entity.');
      } else {
        this.toastr.warning('Form is invalid');
      }
      return;
    }

    if (!this.newPurchaseItemData || this.newPurchaseItemData.length === 0) {
      this.toastr.warning('Please add at least one item before saving.');
      return;
    }
    const entityId = localStorage.getItem('selectedCompanyId');
    const f = this.newPurchaseRequestForm.getRawValue();
    const submittedDateISO = f.submittedDate ? new Date(f.submittedDate).toISOString() : new Date().toISOString();

    const lsEntity = localStorage.getItem('selectedCompanyId');
    const finalEntityId = lsEntity === 'All' ? Number(f.entityId) : Number(lsEntity);

    if (lsEntity === 'All' && !finalEntityId) {
      this.toastr.info('Please select an Entity.');
      return;
    }

    const matchedSubmitDept = this.departmentList.find(d =>
      d.id === Number(f.department) ||
      (d.name && f.department && d.name.trim().toLowerCase() === String(f.department).trim().toLowerCase())
    );
    const submitDepartmentId = matchedSubmitDept ? matchedSubmitDept.id : (Number(f.department) || null);

    const purchaseItems = this.newPurchaseItemData?.length
      ? this.newPurchaseItemData.map(item => ({
        id: item.id || null,
        itemType: item.itemType || '',
        itemId: Number(item.itemId) || null,
        unitOfMeasurementId: Number(item.unitOfMeasurementId) || null,
        amount: item.amount || 0,
        unitCost: item.unitCost || 0,
        orderQuantity: item.orderQuantity || 0,
        reqByDate: item.reqByDate || new Date(),
        itemDescription: item.itemDescription || '',
        accountId: Number(item.accountId) || 1,
        remarks: item.remarks || '',
        createdBy: item.createdBy || '',
        // purchaseRequestId: item.purchaseRequestId || 0,
        vendorUserId: item.vendorUserId || null,
        vendorCompanyId: item.vendorCompanyId || null,
        vatProdPostingGroup: item.vatProdPostingGroup || this.resolveVatProdPostingGroup(),
        unitOfMeasurementSymbol: this.resolveUomSymbol(item),
        projectId: item.projectId ? Number(item.projectId) : null,
        projectActivityId: item.projectActivityId ? Number(item.projectActivityId) : null,
        departmentId: item.departmentId ? Number(item.departmentId) : submitDepartmentId,
        exceededBudgetAmount: item.exceededBudgetAmount || null,
        requisitionNo: f.requisitionNo,
        attachments: item.attachments?.map(att => ({

          id: att.id || null,
          content: att.content || '',
          contentType: att.contentType || '',
          fileName: att.fileName || '',
          fromForm: att.fromForm || '',
          createdBy: att.createdBy || '',
          // isDeleted: false,
          // purchaseItemId: att.purchaseItemId || 0,
        }))
      }))
      : [];

    const payload = {
      id: this.currentRequestId || null,
      requisitionNo: f.requisitionNo,
      submittedDate: f.submittedDate || null,
      deliveryLocation: f.deliveryLocation,
      receiverName: f.receiverName,
      receiverContact: this.normalizePhoneToString(f.receiverContact),
      status: 'New',
      requestStatus: 'New',
      department: f.department,
      departmentId: submitDepartmentId,
      designation: f.designation,
      businessUnit: f.businessUnit,
      partialDeliveryAcceptable: f.partialDeliveryAcceptable,
      exceptionPolicy: f.exceptionPolicy,
      exceptionPolicyDetails: f.exceptionPolicy ? this.exceptionPolicyData : null,
      subject: f.subject,
      // workflowMasterId: Number(f.workflowMasterId) || 0,
      // createdBy: f.createdBy || 'USER',
      entityId: finalEntityId,
      addressId: f.addressId,
      purchaseItems
    };

    if (this.currentRequestId) {
      this.loading = true;
      this.spinner.show();
      this.purchaseRequestService.updatePurchaseRequest(this.currentRequestId, { purchaseRequest: payload })
        .pipe(finalize(() => this.spinner.hide()))
        .subscribe({
          next: res => {
            this.loading = false;
            this.spinner.hide();
            this.router.navigate(['/purchase-request']);
          },
          error: err => {
            console.error('Error updating Purchase Request:', err);
            this.toastr.error('Something went wrong.', '');
            this.loading = false;
          }
        });
    }
    else {
      this.loading = true;
      this.spinner.show();
      this.purchaseRequestService.createPurchaseRequest({ purchaseRequest: payload, isDraft: false })
        .pipe(finalize(() => this.spinner.hide()))
        .subscribe({
          next: res => {
            console.log('Purchase Request Created:', res);
            // this.attachmentList.forEach(a => a.isNew = false);
            // this.numberOfAttachments = this.attachmentList.length;
            this.loading = false;
            this.spinner.hide();
            this.router.navigate(['/purchase-request']);
          },
          error: err => {
            console.error('Error creating Purchase Request:', err);
            this.toastr.error('Something went wrong.');
            this.loading = false;
          }
        });
    }
  }

  openNewEntityModal(rowIndex: number | null = null) {
    const modalRef = this.modalService.open(PurchaseRequestAttachmentModalComponent, {
      backdrop: 'static',
      size: 'lg',
      centered: true,
    });

    modalRef.componentInstance.viewMode = this.viewMode;
    modalRef.componentInstance.isSubmitter = this.isSubmitter;
    modalRef.componentInstance.isStatusCompleted = this.isStatusCompleted;

    // Pass existing attachments to modal
    modalRef.componentInstance.data = {
      existingAttachment: rowIndex !== null
        ? this.newPurchaseItemData[rowIndex].attachments || []
        : this.itemForm.get('attachments')?.value || [],
      purchaseItemId: rowIndex !== null ? this.newPurchaseItemData[rowIndex].id : 0
    };

    // Listen to changes immediately
    modalRef.componentInstance.attachmentsChange.subscribe((attachments: any[]) => {
      if (rowIndex !== null) {
        this.newPurchaseItemData = this.newPurchaseItemData.map((item, i) =>
          i === rowIndex ? { ...item, attachments } : item
        );
      } else {
        this.itemForm.patchValue({ attachments });
      }
    });

    // Optional: final payload when modal closes
    modalRef.result.then((data: any[]) => {
      if (data) {
        // merge with existing to avoid duplicates
        if (rowIndex !== null) {
          const existingAttachments = this.newPurchaseItemData[rowIndex].attachments || [];
          const merged = [...existingAttachments, ...data.filter(d => !existingAttachments.some(e => e.fileName === d.fileName))];
          this.newPurchaseItemData[rowIndex].attachments = merged;
        } else {
          const existingAttachments = this.itemForm.get('attachments')?.value || [];
          const merged = [...existingAttachments, ...data.filter(d => !existingAttachments.some(e => e.fileName === d.fileName))];
          this.itemForm.patchValue({ attachments: merged });
        }
      }
    }).catch(() => { });
  }

  hasUnsavedChanges(): boolean {
    return this.newPurchaseRequestForm.dirty || this.itemForm.dirty || this.newPurchaseItemData.length > 0;
  }

  onSubmitForApproval() {
    Swal.fire({
      title: 'Submit for Approval?',
      text: 'Are you sure you want to submit this Purchase Request for approval?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, submit it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        this.purchaseRequestService.submitForApproval(this.currentRequestId)
          .pipe(finalize(() => this.spinner.hide()))
          .subscribe({
            next: (res) => {
              this.router.navigate(['/purchase-request']);
            },
            error: (err) => {
              console.error(err);
              Swal.fire({
                icon: 'error',
                title: 'Failed!',
                text: 'Failed to submit purchase request for approval.',
              });
              //this.dataLoaded = true;
            },
          });
      }
    });
  }

  onAddRemarks(action: string): void {
    const modalRef = this.modalService.open(PurchaseRequestRemarksComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.action = action;
    modalRef.componentInstance.requisitionNo = this.currentRequisitionNo;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loading = true;
          const payload = {
            RequisitionNo: this.currentRequisitionNo,
            Remarks: result.remarks,
            ActionTaken: action,
            ApproverId: localStorage.getItem('userId')
          };
          this.spinner.show();
          this.purchaseRequestService.addRemarksWithActionTaken(payload)
            .pipe(finalize(() => this.spinner.hide()))
            .subscribe({
              next: res => {
                this.loading = false;
                // if (res.message == "Approved") {
                //this.dataLoaded = true;
                this.toastr.success(res.message);
                this.cdr.detectChanges();
                this.router.navigate(['/purchase-request']);

                // this.toastr.success(res.message);
                //}
                // else {
                //   this.toastr.warning(res.message);
                // }
              },
              error: err => {
                this.toastr.warning('Something went Wrong', '');
                this.loading = false;
                //this.dataLoaded = true;
              }
            });

        }
      },
      (reason) => {
        console.log(`Modal dismissed: ${reason}`);
      }
    );
  }
  loadVendorsFinalSelection() {
    this.purchaseRequestService.getVendorsAndCompanyForFinalSelection(this.procurementUserId)
      .subscribe(res => {
        this.finalVendors = res.value ?? res.data ?? res;
      });
  }

  onVendorChange(vendorId: string | null) {
    if (!vendorId) {
      this.filteredCompanies = null;
      this.itemForm.patchValue({ vendorCompanyId: null }, { emitEvent: false });
      return;
    }
    const vendor = this.finalVendors.find(v => v.vendorId === vendorId);
    this.filteredCompanies = vendor || null;
    // Only clear when ADDING (not editing)
    if (this.editingRowIndex === null) {
      this.itemForm.patchValue({ vendorCompanyId: null }, { emitEvent: false });
    }
  }

  clearItemForm(): void {
    this.itemForm.reset({
      id: null,
      requisitionNo: '',
      itemType: 'Inventory',
      projectId: null,
      projectActivityId: null,
      itemId: null,
      unitOfMeasurementId: 0,
      amount: 0,
      unitCost: 0,
      orderQuantity: 0,
      reqByDate: this.toDateInputValue(new Date()),
      itemDescription: '',
      vendorUserId: null,
      vendorCompanyId: null,
      accountId: 1,
      remarks: '',
      attachments: []
    });

    this.editingRowIndex = null;
    this.selectedRow = null;
    this.selectedUomLabel = '';
    this.unitsOfMeasurementList = [];
    this.itemForm.get('unitOfMeasurementId')?.disable({ emitEvent: false });

    this.filteredCompanies = [];
    this.syncFinalVendorControlState();

    this.selectedProjectInfo = null;
    this.selectedActivityInfo = null;
    this.currentProjectActivities = [];
    this.isBudgetExceeded = false;
    this.budgetWarningType = 'none';
    this.budgetExceededMessage = '';

    this.itemForm.markAsPristine();
    this.itemForm.markAsUntouched();
    this.cdr.detectChanges();
  }

  private syncFinalVendorControlState(): void {
    if (!this.isSelectingFinalVendor) return;

    const canEditVendor = this.editingRowIndex !== null;
    const vendorUserCtrl = this.itemForm.get('vendorUserId');
    const vendorCompanyCtrl = this.itemForm.get('vendorCompanyId');

    if (canEditVendor) {
      vendorUserCtrl?.enable({ emitEvent: false });
      vendorCompanyCtrl?.enable({ emitEvent: false });
    } else {
      vendorUserCtrl?.disable({ emitEvent: false });
      vendorCompanyCtrl?.disable({ emitEvent: false });
    }
  }
  triggerFileUpload(input: HTMLInputElement): void {
    input.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) {
      return;
    }

    this.spinner.show();
    const start = Date.now();

    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        console.log('Parsed Excel JSON:', jsonData);
        this.uploadedItems = jsonData as any[];

        // 🔥 Directly run the same bulk logic
        this.bulkInsert();
      } catch (err) {
        console.error('Error parsing Excel:', err);
        this.toastr.error('Invalid or corrupted file. Please check and try again.');
        this.spinner.hide();
        this.cdr.markForCheck();
      } finally {
        this.spinner.hide();
        this.cdr.markForCheck();
        // allow re-selecting the same file again
        input.value = '';
      }
    };

    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      this.toastr.error('Failed to read file. Please try again.');
      this.spinner.hide();
      input.value = '';
    };

    reader.readAsArrayBuffer(file);
  }


  bulkInsert(): void {
    if (!this.uploadedItems.length) {
      if (this.newPurchaseItemData.length > 0) {
        this.toastr.info('Items already inserted.');
      } else {
        this.toastr.warning('No items to insert.');
      }
      return;
    }

    const requiredColumns = [
      'Item Type',
      'Item',
      'U of M',
      // 'Unit Cost',
      'Order Quantity',
      'Amount',
      'Item Description',
      // 'Final Vendor',
      // 'Vendor Company',
      'Account',
      'Remarks'
    ];

    const hasReqByDate = this.uploadedItems.some(
      (item) => 'Req By Date' in item || 'Req. by Date' in item
    );

    if (!hasReqByDate) {
      this.toastr.error('Invalid file! Missing column: Req. by Date (or Req By Date)');
      return;
    }

    const firstRow = this.uploadedItems[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
      this.toastr.error(`Invalid file! Missing columns: ${missingColumns.join(', ')}`);
      return;
    }

    //  Map Excel data
    const mappedData = this.uploadedItems.map((item) => {
      const rawDate = item['Req By Date'] || item['Req. by Date'];
      let parsedDate: Date | null = null;

      if (rawDate) {
        if (!isNaN(rawDate)) parsedDate = this.excelSerialToDate(Number(rawDate));
        else parsedDate = new Date(rawDate);
      }

      const budgetAmount =
        Number(item['Amount']) ||
        Number(item['Budget Amount']) ||
        0;

      return {
        itemType: item['Item Type'] || 'Inventory',
        itemId: this.getItemIdByName(item['Item']) || null,
        unitOfMeasurementId: this.getUOMIdByName(item['U of M']) || null,
        // unitCost: Number(item['Unit Cost']) || 0,
        unitCost: 0,
        orderQuantity: Number(item['Order Quantity']) || 0,
        // amount: Number(item['Unit Cost']) * Number(item['Order Quantity']),
        amount: budgetAmount,
        reqByDate: parsedDate,
        itemDescription: item['Item Description'] || '',
        // vendorUserId: this.getVendorIdByName(item['Final Vendor']) || null,
        // vendorCompanyId: this.getVendorCompanyIdByName(item['Vendor Company']) || null,
        vendorUserId: null,
        vendorCompanyId: null,
        accountId: this.getAccountIdByName(item['Account']) || 1,
        remarks: item['Remarks'] || '',
        vatProdPostingGroup: this.resolveVatProdPostingGroup(),
        unitOfMeasurementSymbol: (item['U of M'] || '').toString().trim() || null,
        attachments: []
      };
    });

    //  Always append new bulk data after existing manual entries
    console.log('Before merge:', this.newPurchaseItemData);
    this.newPurchaseItemData = [...this.newPurchaseItemData, ...mappedData];
    console.log('After merge:', this.newPurchaseItemData);

    this.uploadedItems = [];
    this.toastr.success('Bulk items appended successfully!');

    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }, 50);
  }

  getItemIdByName(name: string): number | null {
    const item = this.itemList.find(
      (x) => x.description?.trim().toLowerCase() === name?.trim().toLowerCase()
    );
    return item ? item.id : null;
  }

  getUOMIdByName(name: string): number | null {
    const uom = this.uomMasterList.find(
      (x) => x.description?.trim().toLowerCase() === name?.trim().toLowerCase()
    );
    return uom ? uom.id : null;
  }

  getVendorIdByName(name: string): number | null {
    const vendor = this.finalVendors.find(
      (x) => x.vendorName?.trim().toLowerCase() === name?.trim().toLowerCase()
    );
    return vendor ? Number(vendor.vendorId) : null;
  }

  getVendorCompanyIdByName(name: string): number | null {
    const company = this.filteredCompanies.find(
      (x) => x.companyName?.trim().toLowerCase() === name?.trim().toLowerCase()
    );
    return company ? company.companyId : null;
  }

  getAccountIdByName(name: string): number | null {
    const account = this.accountList.find(
      (x) => x.description?.trim().toLowerCase() === name?.trim().toLowerCase()
    );
    return account ? account.id : null;
  }

  excelSerialToDate(serial: number): Date | null {
    if (!serial || isNaN(serial)) return null;
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
  }

  /**
   * Dispatches to the correct PO flow based on data source configuration.
   * - BC mode with 'purchase-order' in forms → requestPO (vendor selection / request flow)
   * - Local mode or BC without 'purchase-order' → createPODirect (immediate creation)
   */
  onPOButtonClick(row: any): void {
    if (this.useRequestPOMode) {
      this.requestPO(row);
    } else {
      this.createPODirect(row);
    }
  }

  requestPO(row: any) {
    if (!this.newPurchaseItemData || this.newPurchaseItemData.length === 0) {
      this.toastr.info('No items available for requesting Purchase Order.');
      return;
    }

    const hasMissingVendor = this.newPurchaseItemData.some(item =>
      !item.vendorUserId
    );

    if (hasMissingVendor) {
      this.toastr.info('Please select vendor for all items.');
      return;
    }

    Swal.fire({
      title: 'Request Purchase Order?',
      text: 'This will send a request for PO for all items based on vendor assignment.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Request PO',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const vendorUpdates = this.newPurchaseItemData.map(item => ({
          purchaseItemId: item.id,
          vendorUserId: item.vendorUserId,
          vendorCompanyId: item.vendorCompanyId
        }));
        this.spinner.show();
        this.purchaseOrderService.createPurchaseOrderFromPR(this.currentRequestId, vendorUpdates)
          .pipe(finalize(() => this.spinner.hide()))
          .subscribe({
            next: () => {
              this.router.navigate(['/purchase-request']);
            },
            error: () => {
              this.toastr.error('Something went wrong while requesting PO.');
            }
          });
      }
    });
  }

  /**
   * Creates PO(s) directly from the PR after vendor selection in the form.
   * Used when the data source is local (or BC but 'purchase-order' not in BC forms).
   * Mirrors requestPO validation but sends createDirectly=true so the API
   * creates actual PurchaseOrder entities instead of just marking them as requested.
   */
  createPODirect(row: any): void {
    if (!this.newPurchaseItemData || this.newPurchaseItemData.length === 0) {
      this.toastr.info('No items available for creating Purchase Order.');
      return;
    }

    const hasMissingVendor = this.newPurchaseItemData.some(item => !item.vendorUserId);
    if (hasMissingVendor) {
      this.toastr.info('Please select a vendor for all items.');
      return;
    }

    Swal.fire({
      title: 'Create Purchase Order?',
      text: 'This will generate PO(s) for all items based on your vendor selection.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Create PO',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const vendorUpdates = this.newPurchaseItemData.map(item => ({
          purchaseItemId: item.id,
          vendorUserId: item.vendorUserId,
          vendorCompanyId: item.vendorCompanyId
        }));
        this.spinner.show();
        this.purchaseOrderService.createPurchaseOrderFromPR(this.currentRequestId, vendorUpdates, true)
          .pipe(finalize(() => this.spinner.hide()))
          .subscribe({
            next: () => {
              this.toastr.success('Purchase Order(s) created successfully.');
              this.router.navigate(['/purchase-request']);
            },
            error: (err: any) => {
              const msg = err?.error?.message || err?.error || 'Something went wrong while creating PO.';
              this.toastr.error(typeof msg === 'string' ? msg : 'Something went wrong while creating PO.');
            }
          });
      }
    });
  }

  selectRow(row: any) {
    this.selectedRow = row;
  }


  async onExceptionPolicyToggle(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const checked = !!input.checked;

    const ctrl = this.newPurchaseRequestForm.get('exceptionPolicy');
    if (!ctrl) return;

    // ✅ if modal already open, block
    if (this.exceptionModalOpen || this.modalService.hasOpenModals()) {
      // revert UI state to form value
      input.checked = !!ctrl.value;
      return;
    }

    // =========================
    // ✅ CHECKED: open create modal
    // =========================
    if (checked) {
      // set checkbox true immediately (so UI matches)
      ctrl.setValue(true, { emitEvent: false });

      // open modal next tick (prevents click-cycle issues)
      setTimeout(() => this.openExceptionPolicyModal({ mode: 'create' }), 0);
      return;
    }

    // =========================
    // ✅ UNCHECKED: confirm + clear
    // =========================
    // if nothing saved, just turn off
    if (!this.exceptionPolicyData) {
      ctrl.setValue(false, { emitEvent: false });
      this.showExceptionPolicyView = false;
      return;
    }

    const res = await Swal.fire({
      title: 'Remove Exception Policy?',
      text: 'If you uncheck, all exception policy information will be cleared and lost.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });

    if (res.isConfirmed) {
      this.exceptionPolicyData = null;
      this.showExceptionPolicyView = false;
      ctrl.setValue(false, { emitEvent: false });
      this.checkBudgetLimit();
    } else {
      // revert back ON
      ctrl.setValue(true, { emitEvent: false });
      input.checked = true;
      this.showExceptionPolicyView = true;
      this.checkBudgetLimit();
    }
  }


  openExceptionPolicyModal(opts?: { mode: 'create' | 'view' }) {
    if (this.exceptionModalOpen || this.modalService.hasOpenModals()) return;

    const ctrl = this.newPurchaseRequestForm.get('exceptionPolicy');
    if (!ctrl) return;

    this.exceptionModalOpen = true;

    const mode = opts?.mode ?? 'create';

    const modalRef = this.modalService.open(PurchaseRequestExceptionPolicyComponent, {
      backdrop: 'static',
      size: 'lg',
      centered: true,
      keyboard: false
    });

    const f = this.newPurchaseRequestForm.getRawValue();
    modalRef.componentInstance.viewMode = this.viewMode;
    modalRef.componentInstance.data = {
      requisitionNo: f.requisitionNo,
      requesterName: f.receiverName,
      subject: f.subject,
      department: f.department,
      mode,
      existing: this.exceptionPolicyData
    };

    if (this.exceptionPolicyData) {
      modalRef.componentInstance.exceptionPolicyForm?.patchValue({
        requisitionNo: this.exceptionPolicyData.requisitionNo,
        requesterName: this.exceptionPolicyData.requesterName,
        subject: this.exceptionPolicyData.subject,
        department: this.exceptionPolicyData.department,
        description: this.exceptionPolicyData.description,
        estimatedValue: this.exceptionPolicyData.estimatedValue,
        justification: this.exceptionPolicyData.justification,
        waiveApproval: !!this.exceptionPolicyData.waiveApproval,
        waiveAmount: !!this.exceptionPolicyData.waiveAmount
      }, { emitEvent: false });
    } else {
      modalRef.componentInstance.exceptionPolicyForm?.patchValue({
        requesterName: f.receiverName,
        requisitionNo: f.requisitionNo,
        subject: f.subject,
        department: f.department,
        waiveApproval: false,
        waiveAmount: false
      }, { emitEvent: false });
    }


    modalRef.result
      .then((result) => {
        this.exceptionModalOpen = false;

        if (result) {
          // save
          this.exceptionPolicyData = result;
          this.showExceptionPolicyView = true;

          ctrl.setValue(true, { emitEvent: false });
          this.checkBudgetLimit();
          return;
        }

        // cancel: if nothing saved, uncheck
        if (!this.exceptionPolicyData) {
          ctrl.setValue(false, { emitEvent: false });
          this.showExceptionPolicyView = false;
        }
        this.checkBudgetLimit();
      })
      .catch(() => {
        this.exceptionModalOpen = false;

        if (!this.exceptionPolicyData) {
          ctrl.setValue(false, { emitEvent: false });
          this.showExceptionPolicyView = false;
        }
        this.checkBudgetLimit();
      });
  }

  onViewExceptionPolicy(): void {
    if (!this.exceptionPolicyData) return;
    this.openExceptionPolicyModal({ mode: 'view' });
  }

  focusReceiverCountrySearch(): void {
    setTimeout(() => {
      const root = this.receiverIntlWrap?.nativeElement;
      const searchInput =
        root?.querySelector<HTMLInputElement>('#country-search-box') ??
        document.querySelector<HTMLInputElement>('#country-search-box');

      if (searchInput) {
        searchInput.focus();
      }
    }, 0);
  }

  @ViewChildren(NgSelectComponent) selectComponents?: QueryList<NgSelectComponent>;
  private currentlyOpenSelect: any = null;
  private panelPositionObserver?: MutationObserver;
  private panelResizeObserver?: ResizeObserver;

  @HostListener('document:mousedown', ['$event'])
  onDocumentMousedown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    // If click is inside an open dropdown panel, keep it open (e.g. search input, options scroll)
    if (target.closest('.ng-dropdown-panel')) {
      return;
    }

    const clickedSelect = target.closest('ng-select');

    if (this.currentlyOpenSelect) {
      const currentHost = this.currentlyOpenSelect?.element || (this.currentlyOpenSelect as any)?._elementRef?.nativeElement;
      // If clicked completely outside or on a different ng-select, close the currently open one immediately
      if (!clickedSelect || (currentHost && clickedSelect !== currentHost)) {
        try {
          this.currentlyOpenSelect.close();
          if (typeof this.currentlyOpenSelect.detectChanges === 'function') {
            this.currentlyOpenSelect.detectChanges();
          }
        } catch (e) {}
        this.currentlyOpenSelect = null;
      }
    }
  }


  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.currentlyOpenSelect) {
      this.adjustDropdownPosition(this.currentlyOpenSelect);
    }
  }

  private adjustDropdownPosition(selectInstance?: any): void {
    const select = selectInstance || this.currentlyOpenSelect;
    if (!select) return;

    const host = select.element || (select as any)?._elementRef?.nativeElement;
    if (!host) return;

    const panels = document.querySelectorAll('.ng-dropdown-panel');
    if (!panels.length) return;
    const panel = panels[panels.length - 1] as HTMLElement;
    if (!panel) return;

    const selectRect = host.getBoundingClientRect();
    const panelHeight = panel.offsetHeight;
    if (!panelHeight) return;

    const isTop = panel.classList.contains('ng-select-top');

    if (isTop) {
      panel.style.position = 'fixed';
      panel.style.top = `${Math.max(10, selectRect.top - panelHeight - 2)}px`;
      panel.style.bottom = 'auto';
      panel.style.left = `${selectRect.left}px`;
      panel.style.width = `${selectRect.width}px`;
    } else if (panel.classList.contains('ng-select-bottom')) {
      panel.style.position = 'fixed';
      panel.style.top = `${selectRect.bottom + 2}px`;
      panel.style.bottom = 'auto';
      panel.style.left = `${selectRect.left}px`;
      panel.style.width = `${selectRect.width}px`;
    }
  }

  private observePanel(panel: HTMLElement, selectInstance: any): void {
    if (this.panelPositionObserver) {
      this.panelPositionObserver.disconnect();
    }
    if (this.panelResizeObserver) {
      this.panelResizeObserver.disconnect();
    }

    this.panelPositionObserver = new MutationObserver(() => {
      if (panel.classList.contains('ng-select-top') && panel.style.bottom !== 'auto') {
        this.adjustDropdownPosition(selectInstance);
      }
    });

    this.panelPositionObserver.observe(panel, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    if (typeof ResizeObserver !== 'undefined') {
      this.panelResizeObserver = new ResizeObserver(() => {
        this.adjustDropdownPosition(selectInstance);
      });
      this.panelResizeObserver.observe(panel);
    }
  }

  onDropdownOpen(openedSelect?: any): void {
    // 1. Close previously open select instance immediately
    if (this.currentlyOpenSelect && this.currentlyOpenSelect !== openedSelect) {
      try {
        this.currentlyOpenSelect.close();
        if (typeof this.currentlyOpenSelect.detectChanges === 'function') {
          this.currentlyOpenSelect.detectChanges();
        }
      } catch (e) {}
    }

    // 2. Also close all other selects in the ViewChildren list
    if (this.selectComponents) {
      this.selectComponents.forEach((select) => {
        if (select !== openedSelect && select.isOpen) {
          try {
            select.close();
            if (typeof select.detectChanges === 'function') {
              select.detectChanges();
            }
          } catch (e) {}
        }
      });
    }

    this.currentlyOpenSelect = openedSelect;

    setTimeout(() => {
      const panels = document.querySelectorAll('.ng-dropdown-panel');
      if (panels.length) {
        const lastPanel = panels[panels.length - 1] as HTMLElement;
        this.observePanel(lastPanel, openedSelect);
        this.adjustDropdownPosition(openedSelect);

        const input = lastPanel.querySelector('.dropdown-search-input') as HTMLInputElement;
        if (input) {
          input.value = '';
          input.focus();
        }
      }
    }, 0);

    setTimeout(() => {
      this.adjustDropdownPosition(openedSelect);
    }, 40);

    setTimeout(() => {
      this.adjustDropdownPosition(openedSelect);
    }, 120);
  }

  onDropdownClose(select: any): void {
    if (this.panelPositionObserver) {
      this.panelPositionObserver.disconnect();
      this.panelPositionObserver = undefined;
    }
    if (this.panelResizeObserver) {
      this.panelResizeObserver.disconnect();
      this.panelResizeObserver = undefined;
    }
    if (this.currentlyOpenSelect === select) {
      this.currentlyOpenSelect = null;
    }
  }
}