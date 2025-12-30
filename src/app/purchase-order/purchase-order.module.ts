import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PurchaseOrderRoutingModule } from './purchase-order-routing.module';
import { PurchaseOrderListComponent } from './purchase-order-list/purchase-order-list.component';
import { NgxDatatableModule } from "@swimlane/ngx-datatable";
import { CreatePurchaseOrderComponent } from './create-purchase-order/create-purchase-order.component';
import { AutoResizeDatatableDirective } from 'app/shared/directives/table-auto-resize.directive';
import { PurchaseOrderDetailsComponent } from './purchase-order-details/purchase-order-details.component';
import { ShipmentDetailsComponent } from './purchase-order-details/shipment-details/shipment-details.component';
import { GrnDetailsComponent } from './purchase-order-details/grn-details/grn-details.component';
import { InvoiceComponent } from './purchase-order-details/invoice/invoice.component';
import { PermissionDirective } from 'app/shared/permissions/permission.directive';
import { VendorRating } from './purchase-order-details/vendor-rating/vendor-rating';
import { ReactiveFormsModule } from '@angular/forms';
import { DatatableAutoResizeDirective } from 'app/shared/directives/dataTable-auto-resize.directive';


@NgModule({
  declarations: [
    PurchaseOrderListComponent,
    CreatePurchaseOrderComponent,
    PurchaseOrderDetailsComponent,
    ShipmentDetailsComponent,
    GrnDetailsComponent,
    InvoiceComponent,
    VendorRating
  ],
  imports: [
    CommonModule,
    PurchaseOrderRoutingModule,
    NgxDatatableModule,
    AutoResizeDatatableDirective,
    PermissionDirective,
    ReactiveFormsModule,
    DatatableAutoResizeDirective
]   
})
export class PurchaseOrderModule { }
