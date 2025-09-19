import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { RfqQuotationboxComponent } from '../rfq-quotationbox/rfq-quotationbox.component';
import { RfqVendorModalComponent } from '../rfq-vendor-modal/rfq-vendor-modal.component';
import { VendorComparisionComponent } from '../vendor-comparision/vendor-comparision.component';
import { RfqService } from '../rfq.service';

@Component({
  selector: 'app-rfq',
  templateUrl: './rfq.component.html',
  styleUrls: ['./rfq.component.scss']
})

export class RfqComponent implements OnInit {
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  rfqData: any[] = [];
  chkBoxSelected: any[] = [];
  idsToDelete: number[] = [];
  loading = false;
  announcementId: number;
  isEditButtonDisabled = true;
  isDeleteButtonDisabled = true;
  isOpenButtonDisabled = true;
  isAllSelected = false;
  columns = [];

  // public chkBoxSelected = [];
  // loading = false;
  // public rows = [];
  // columns = [];
  // announcementId: number;
  // isEditButtonDisabled: boolean = true;
  // isDeleteButtonDisabled: boolean = true;
  // isOpenButtonDisabled: boolean = true;
  // isAddNewDisable:boolean= true;
  // isAllSelected: boolean = false;

  constructor(private router: Router, private modalService: NgbModal,
    private route: ActivatedRoute, private rfqService: RfqService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadRfqs();
  }

  loadRfqs() {
    this.loading = true;
    this.rfqService.getAllQuotations().subscribe({
      next: (data: any) => {
        this.rfqData = data?.$values || [];
        console.log('Raw API Response:', data);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching RFQs:', err);
        this.loading = false;
      }
    });
  }

  onView() {
    if (this.chkBoxSelected.length !== 1) {
      alert('Please select exactly one record to view.');
      return;
    }

    const selectedId = this.chkBoxSelected[0].quotationId;

    this.router.navigate(['/rfq/new-rfq'], {
      queryParams: { id: selectedId, mode: 'view' }
    });
  }

  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  openEmpDetails() {
    this.router.navigate(['/rfq/new-rfq']);
  }

  onSort(event) {
    this.loading = true;
    setTimeout(() => {
      const sort = event.sorts[0];
      this.rfqData.sort((a, b) => {
        const aValue = (a[sort.prop] ?? '').toString();
        const bValue = (b[sort.prop] ?? '').toString();
        return aValue.localeCompare(bValue) * (sort.dir === 'desc' ? -1 : 1);
      });
      this.loading = false;
    }, 200);
  }

  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [...selected];
    this.idsToDelete = this.chkBoxSelected.map(item => item.quotationId);
    this.enableDisableButtons();
  }

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.chkBoxSelected = [...this.rfqData];
    } else {
      this.chkBoxSelected = [];
    }
    this.idsToDelete = this.chkBoxSelected.map(item => item.quotationId);
    this.isAllSelected = event.target.checked;
    this.enableDisableButtons();
  }

  enableDisableButtons() {
    const selectedCount = this.chkBoxSelected.length;
    this.isDeleteButtonDisabled = selectedCount === 0;
    this.isEditButtonDisabled = selectedCount !== 1;
    this.isOpenButtonDisabled = selectedCount === 0;
    this.isAllSelected = this.rfqData.length === this.chkBoxSelected.length;
  }

  openDeleteModal(deleteModal) {
    if (this.idsToDelete.length > 0) {
      this.modalService.open(deleteModal, { backdrop: 'static', centered: true });
    } else {
      alert('Please select at least one record to delete.');
    }
  }

  confirmDelete() {
    if (this.idsToDelete.length === 0) return;

    console.log('Deleting IDs:', this.idsToDelete);

    this.rfqService.deleteQuotation(this.idsToDelete).subscribe({
      next: () => {
        this.modalService.dismissAll();
        this.loadRfqs();
        this.chkBoxSelected = [];
        this.idsToDelete = [];
      },
      error: (err) => {
        console.error('Delete failed:', err);
      }
    });
  }

  onUpdate() {
    if (this.chkBoxSelected.length === 0) {
      alert('Please select a record to update.');
      return;
    }

    if (this.chkBoxSelected.length > 1) {
      alert('Please select only one record to update.');
      return;
    }

    const selectedId = this.chkBoxSelected[0].quotationId;
    console.log('Navigating to update ID:', selectedId);

    this.router.navigate(['/rfq/new-rfq'], {
      queryParams: { id: selectedId }
    });
  }

  openQuotationBoxModal(row: any): void {
    const modalRef = this.modalService.open(RfqQuotationboxComponent, { size: 'lg', backdrop: 'static', centered: true });
    modalRef.componentInstance.data = row;  // Pass selected row data if needed
  }

  openVendorsModal(row: any): void {
    const modalRef = this.modalService.open(RfqVendorModalComponent, { size: 'lg', backdrop: 'static', centered: true });
    modalRef.componentInstance.data = row;  // Pass selected row data if needed
  }

  openVendorComparisonModal(row: any): void {
    const modalRef = this.modalService.open(VendorComparisionComponent, { size: 'lg', backdrop: 'static', centered: true });
    modalRef.componentInstance.data = row;  // Pass selected row data if needed
  }

}

