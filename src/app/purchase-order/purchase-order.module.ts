import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PurchaseOrderRoutingModule } from './purchase-order-routing.module';
import { PurchaseOrderListComponent } from './purchase-order-list/purchase-order-list.component';
import { NgxDatatableModule } from "@swimlane/ngx-datatable";


@NgModule({
  declarations: [
    PurchaseOrderListComponent
  ],
  imports: [
    CommonModule,
    PurchaseOrderRoutingModule,
    NgxDatatableModule
]
})
export class PurchaseOrderModule { }
