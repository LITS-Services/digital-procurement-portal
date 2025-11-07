import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-rfq-comments',
  templateUrl: './rfq-comments.component.html',
  styleUrls: ['./rfq-comments.component.scss']
})
export class RfqCommentsComponent implements OnInit {

  @Input() vendorsData: any
  @Input() data: any
  selectedVendor: any
  constructor() { }

  ngOnInit(): void {
    console.log("vendord",this.vendorsData )

  }

  selectVendor(vendor: any) {
  this.selectedVendor = vendor;
  }

}
