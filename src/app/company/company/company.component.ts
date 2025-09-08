import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.scss']
})
export class CompanyComponent implements OnInit {
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  tenderingData = [
    {
      requisitionNo: 'TN1234',
      status: 'Pending',
      date: '2023-10-01',
      owner: 'John Doe',
      subject: 'New tender request for IT equipment',
      totalAmount: '$5000'
    },
    {
      requisitionNo: 'TN5678',
      status: 'Approved',
      date: '2023-10-05',
      owner: 'Jane Smith',
      subject: 'Procurement for office furniture',
      totalAmount: '$12000'
    },
    {
      requisitionNo: 'TN1234',
      status: 'Pending',
      date: '2023-10-01',
      owner: 'John Doe',
      subject: 'New tender request for IT equipment',
      totalAmount: '$5000'
    },
    {
      requisitionNo: 'TN1234',
      status: 'Pending',
      date: '2023-10-01',
      owner: 'John Doe',
      subject: 'New tender request for IT equipment',
      totalAmount: '$5000'
    },
    {
      requisitionNo: 'TN5678',
      status: 'Approved',
      date: '2023-10-05',
      owner: 'Jane Smith',
      subject: 'Procurement for office furniture',
      totalAmount: '$12000'
    },
    {
      requisitionNo: 'TN1234',
      status: 'Pending',
      date: '2023-10-01',
      owner: 'John Doe',
      subject: 'New tender request for IT equipment',
      totalAmount: '$5000'
    },
  ];
  
  public chkBoxSelected = [];
  loading = false;
  public rows = [];
  columns = [];
  announcementId: number;
  isEditButtonDisabled: boolean = true;
  isDeleteButtonDisabled: boolean = true;
  isOpenButtonDisabled: boolean = true;
  isAddNewDisable:boolean= true;
  isAllSelected: boolean = false;
  constructor(private router: Router,
    private modalService: NgbModal) { }

  ngOnInit(): void {
  }
  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }
  openEmpDetails() {
   
    this.router.navigate(['/purchase-request/new-purchase-request']);
  }
  onSort(event) {
    this.loading = true;
    setTimeout(() => {
      const rows = [...this.rows];
      const sort = event.sorts[0];
      rows.sort((a, b) => {
        return a[sort.prop].localeCompare(b[sort.prop]) * (sort.dir === 'desc' ? -1 : 1);
      });
  
      this.rows = rows;
      this.loading = false;
    }, 1000);
  }
  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [];
    this.chkBoxSelected.splice(0, this.chkBoxSelected.length);
    this.chkBoxSelected.push(...selected);
    this.announcementId = selected[0]?.id;
    // Enable/disable edit and delete buttons based on the number of selected rows
    this.enableDisableButtons();

  }
  enableDisableButtons() {
    const selectedRowCount = this.chkBoxSelected.length;
    // Disable edit button by default
   // this.isEditButtonDisabled = true;
    // Enable delete button only if at least one row is selected
    this.isDeleteButtonDisabled = selectedRowCount === 0;
    // Enable edit button only if exactly one row is selected
    this.isEditButtonDisabled = selectedRowCount !== 1;
    this.isOpenButtonDisabled = selectedRowCount === 0;

      //this.isDeleteButtonDisabled =true;
if(this.tenderingData.length!=this.chkBoxSelected.length){
  this.isAllSelected=false;
}
else{
  this.isAllSelected=true;
}
  }

}
