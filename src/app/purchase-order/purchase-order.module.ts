import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PurchaseOrderRoutingModule } from './purchase-order-routing.module';
import { PurchaseOrderListComponent } from './purchase-order-list/purchase-order-list.component';
import { NgxDatatableModule } from "@swimlane/ngx-datatable";
import { CreatePurchaseOrderComponent } from './create-purchase-order/create-purchase-order.component';
import { AutoResizeDatatableDirective } from 'app/shared/directives/table-auto-resize.directive';


@NgModule({
  declarations: [
    PurchaseOrderListComponent,
    CreatePurchaseOrderComponent
  ],
  imports: [
    CommonModule,
    PurchaseOrderRoutingModule,
    NgxDatatableModule,
    AutoResizeDatatableDirective
]
})
export class PurchaseOrderModule { }
