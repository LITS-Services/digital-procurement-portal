import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-rfq-quotationbox',
  templateUrl: './rfq-quotationbox.component.html',
  styleUrls: ['./rfq-quotationbox.component.scss']
})
export class RfqQuotationboxComponent implements OnInit {
  @Input() data: any;
  // @ViewChild(DatatableComponent) table: DatatableComponent;

  public chkBoxSelected = [];
  loading = false;
  rfqData = []; // Will fill with dummy data in ngOnInit
  isAllSelected: boolean = false;
  itemsData = [];
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  public rows = [];
  columns = [];
  isCreateMode = false;
  newPurchaseRequestForm: FormGroup;
  constructor(
    private router: Router,
    public activeModal: NgbActiveModal,
    private fb: FormBuilder

  ) { }

  ngOnInit(): void {

    this.itemsData = [
      {
        itemCode: 'ITM001',
        deliveryDate: '2025-05-05',
        description: 'Item 1 Description',
        amount: 1200
      },
      {
        itemCode: 'ITM002',
        deliveryDate: '2025-05-10',
        description: 'Item 2 Description',
        amount: 850
      },
      {
        itemCode: 'ITM003',
        deliveryDate: '2025-05-12',
        description: 'Item 3 Description',
        amount: 460
      },
      {
        itemCode: 'ITM004',
        deliveryDate: '2025-05-15',
        description: 'Item 4 Description',
        amount: 1390
      },
      {
        itemCode: 'ITM005',
        deliveryDate: '2025-05-18',
        description: 'Item 5 Description',
        amount: 299
      }
    ]
    this.rfqData = [
      {
        requisitionNo: 'SUP-001',
        status: 'Alpha Supplies Ltd.',
        amount: 12500.00,
        date: '2025-05-21',
        owner: '30 Days',
        subject: 'Pending for Quotation'
      },
      {
        requisitionNo: 'SUP-002',
        status: 'Beta Industrial Co.',
        amount: 9850.75,
        date: '2025-05-21',
        owner: '30 Days',
        subject: 'Pending for Quotation'
      },
      {
        requisitionNo: 'SUP-003',
        status: 'Gamma Traders',
        amount: 15200.00,
        date: '2025-05-21',
        owner: '30 Days',
        subject: 'Pending for Quotation'
      },
      {
        requisitionNo: 'SUP-004',
        status: 'Delta Tech Inc.',
        amount: 17500.99,
        date: '2025-05-21',
        owner: '30 Days',
        subject: 'Pending for Approval'
      },
      {
        requisitionNo: 'SUP-005',
        status: 'Epsilon Distributors',
        amount: 11000.00,
        date: '2025-05-21',
        owner: '30 Days',
        subject: 'Draft'
      },
      {
        requisitionNo: 'SUP-006',
        status: 'Zeta Equipments',
        amount: 21000.45,
        date: '2025-05-21',
        owner: '30 Days',
        subject: 'Pending for Approval'
      },
      {
        requisitionNo: 'SUP-007',
        status: 'Eta Chemicals',
        amount: 8700.30,
        date: '2025-05-21',
        owner: '30 Days',
        subject: 'Pending for Approval'
      },
      {
        requisitionNo: 'SUP-008',
        status: 'Theta Metals',
        amount: 9500.00,
        date: '2025-05-21',
        owner: '30 Days',
        subject: 'Pending for Approval'
      },
      {
        requisitionNo: 'SUP-009',
        status: 'Iota Logistics',
        amount: 13250.75,
        date: '2025-05-21',
        owner: '30 Days',
        subject: 'Pending for Quotation'
      },
      {
        requisitionNo: 'SUP-010',
        status: 'Kappa Services',
        amount: 10200.90,
        date: '2025-05-21',
        owner: '30 Days',
        subject: 'Draft'
      }
    ];

    this.newPurchaseRequestForm = this.fb.group({
      rfqNo: ['', Validators.required],
      prNo: ['', Validators.required],
      date: ['', Validators.required],
      supplier: ['', Validators.required],
      amount: ['', Validators.required],
      specifications: ['', Validators.required],
      paymentTerms: ['', Validators.required],
      validity: ['', Validators.required],
      delivery: ['', Validators.required],
      deviation: ['', Validators.required],
      creator: ['', Validators.required],
      information: ['', Validators.required],

    });

  }


  closeDialog() {
    this.activeModal.close(false);
  }


  openCreateForm() {
    this.isCreateMode = true;
  }

  submitForm() {
    if (this.newPurchaseRequestForm.valid) {
      this.rfqData.push(this.newPurchaseRequestForm.value);
      this.isCreateMode = false;
      this.newPurchaseRequestForm.reset();
    }
  }
  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = selected;
  }

  onSort(event) {
    this.loading = true;
    setTimeout(() => {
      const rows = [...this.rfqData];
      const sort = event.sorts[0];
      rows.sort((a, b) => {
        return a[sort.prop].localeCompare(b[sort.prop]) * (sort.dir === 'desc' ? -1 : 1);
      });

      this.rfqData = rows;
      this.loading = false;
    }, 1000);
  }

  toggleSelectAll(event) {
    if (event.target.checked) {
      this.chkBoxSelected = [...this.rfqData];
    } else {
      this.chkBoxSelected = [];
    }
  }
}
