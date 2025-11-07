import { ChangeDetectorRef, Component, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { CompanyService } from 'app/shared/services/Company.services';
import { RfqService } from '../rfq.service';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-rfq-vendor-modal',
  templateUrl: './rfq-vendor-modal.component.html',
  styleUrls: ['./rfq-vendor-modal.component.scss']
})
export class RfqVendorModalComponent implements OnInit {
  //data!: any;
  @Input() data: any;
  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('tableRowDetails') tableRowDetails: any;
  @ViewChild('tableResponsive') tableResponsive: any;
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  allVendorsandCompanies = [];
  rfqVendors: any[] = [];
  quotationRequestId: number | null = null;

  leftSearch = '';
  rightSearch = '';

    availableVendors: any[] = [];         // LEFT LIST (all - selected)
  filteredSelected: any[] = [];    

  gridSelected: any[] = [];
  private persistedIds = new Set<number>();
  private getKey = (r: any) => (r?.vendorCompanyEntityId ?? r?.id);
  constructor(
   // public activeModal: NgbActiveModal,
    private companyService: CompanyService,
    private rfqService: RfqService,
    public toastr: ToastrService,
    public cdr:ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // this.quotationRequestId = this.data?.quotationId;
    // this.loadRfqVendors(this.quotationRequestId);
  }

    ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue) {
      this.quotationRequestId = this.data.quotationId;
      this.loadRfqVendors(this.quotationRequestId);
    }
  }

  // fetchVendorsAndCompaniesForRfq() {
  //   this.rfqService.getVendorsAndCompaniesForRfq().subscribe({
  //     next: (res: any) => {

  //       this.allVendorsandCompanies = res ?? res?.$values ?? [];

  //     },
  //     error: (err) => {
  //       console.error('Error fetching vendors', err);

  //     }
  //   });
  // }
  fetchVendorsAndCompaniesForRfq() {
    const procurementUserId = localStorage.getItem('userId');
    this.rfqService.getVendorsAndCompaniesForRfq(procurementUserId)
      .subscribe({
        next: (res: any) => {
          this.allVendorsandCompanies = res ?? res?.$values ?? [];
          this.gridSelected = this.allVendorsandCompanies.filter(r => this.persistedIds.has(this.getKey(r)));
                  this.recomputeLists();
             this.cdr.detectChanges()
        },
        error: (err) => {
          console.error('Error fetching vendors', err);
        }
      });
  }

 
  loadRfqVendors(quotationRequestId: number): void {
    this.rfqService.getVendorsByQuotationRequestId(quotationRequestId).subscribe({
      next: (res: any) => {
        this.rfqVendors = res || res?.$values || [];
        this.persistedIds = new Set<number>(this.rfqVendors.map((v: any) => this.getKey(v)));
        this.fetchVendorsAndCompaniesForRfq();
      },

      error: (err) => {
        console.error("Error loading RFQ vendors", err);
           this.persistedIds = new Set<number>();
        this.rfqVendors = [];
        this.fetchVendorsAndCompaniesForRfq();
      }
    });
  }

    recomputeLists(): void {
    const selectedIds = new Set(this.gridSelected.map(x => this.getKey(x)));

    const matchesLeft = (v: any) => {
      const q = this.leftSearch.trim().toLowerCase();
      if (!q) return true;
      return (v.vendorName || '').toLowerCase().includes(q) ||
             (v.companyName || '').toLowerCase().includes(q);
    };

    const matchesRight = (v: any) => {
      const q = this.rightSearch.trim().toLowerCase();
      if (!q) return true;
      return (v.vendorName || '').toLowerCase().includes(q) ||
             (v.companyName || '').toLowerCase().includes(q);
    };

    // left: all - selected
    this.availableVendors = this.allVendorsandCompanies
      .filter(v => !selectedIds.has(this.getKey(v)))
      .filter(matchesLeft);

    // right: selected (filtered)
    this.filteredSelected = this.gridSelected.filter(matchesRight);
  }

    addToRight(vendor: any): void {
    const id = this.getKey(vendor);
    if (this.gridSelected.some(x => this.getKey(x) === id)) return;
    this.gridSelected = [...this.gridSelected, vendor];
    this.recomputeLists();
  }

  removeFromRight(vendor: any): void {
    const id = this.getKey(vendor);
    this.gridSelected = this.gridSelected.filter(x => this.getKey(x) !== id);
    this.recomputeLists();
  }

  selectAll(): void {
    // move everything currently visible on the LEFT into selection
    const currentIds = new Set(this.gridSelected.map(x => this.getKey(x)));
    const toAdd = this.availableVendors.filter(v => !currentIds.has(this.getKey(v)));
    if (toAdd.length) this.gridSelected = [...this.gridSelected, ...toAdd];
    this.recomputeLists();
  }

  removeAll(): void {
    this.gridSelected = [];
    this.recomputeLists();
  }


onSubmit() {
  if (!this.quotationRequestId) return;

  const key = this.getKey;

  // sets for diff
  const currentIds = new Set<number>(this.gridSelected.map((r: any) => key(r)));
  const persisted = this.persistedIds;

  // compute diffs
  const toAddRows = this.allVendorsandCompanies.filter((r: any) =>
    currentIds.has(key(r)) && !persisted.has(key(r))
  );
  const toRemoveIds = Array.from(persisted).filter(id => !currentIds.has(id));

  // payloads
  const addPayload = toAddRows.map((v: any) => ({
    quotationRequestId: this.quotationRequestId!,
    vendorCompanyEntityId: key(v),
    vendorId: v.vendorId,
    vendorCompanyId: v.companyGUID
  }));

  // “no-op” observables when nothing to add/remove
  const add$ = addPayload.length
    ? this.rfqService.addVendorsToQuotation(addPayload)
    : of(null);

  const remove$ = toRemoveIds.length
    ? this.rfqService.removeVendorsFromQuotation({
        quotationRequestId: this.quotationRequestId!,
        vendorCompanyEntityIds: toRemoveIds
      })
    : of(null);

  //this.isSaving = true; // optional spinner flag

  add$
    .pipe(
      switchMap(() => remove$),
      finalize(() => (
        //this.isSaving = false
        console.log('Vendors updated successfully')
      ))
    )
    .subscribe({
      next: () => {

        this.loadRfqVendors(this.quotationRequestId!); // refresh chips + selection
     
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to update vendors');
      }
    });
}



  printVendor(vendor: any) {
    console.log('Printing Vendor:', vendor);
  }

  emailVendor(vendor: any) {
    console.log('Emailing Vendor:', vendor);
  }

  // closeDialog() {
  //   this.activeModal.close(false);
  // }

  // isVendorAdded(companyId: number): boolean {
  //   console.log("sahal", this.rfqVendors.some(v => v.vendorCompanyEntityId === companyId));
  //   return this.rfqVendors.some(v => v.vendorCompanyEntityId === companyId);

  // }



}