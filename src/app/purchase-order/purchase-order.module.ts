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
import { PoApprovalHistoryComponent } from './po-approval-history/po-approval-history.component';
import { PoRemarksComponent } from './po-remarks/po-remarks.component';
import { PermissionDirective } from 'app/shared/permissions/permission.directive';
import { VendorRating } from './purchase-order-details/vendor-rating/vendor-rating';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatatableAutoResizeDirective } from 'app/shared/directives/dataTable-auto-resize.directive';
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";


@NgModule({
  declarations: [
    PurchaseOrderListComponent,
    CreatePurchaseOrderComponent,
    PurchaseOrderDetailsComponent,
    ShipmentDetailsComponent,
    GrnDetailsComponent,
    InvoiceComponent,
    PoApprovalHistoryComponent,
    PoRemarksComponent
  ],
  imports: [
    CommonModule,
    PurchaseOrderRoutingModule,
    NgxDatatableModule,
    AutoResizeDatatableDirective,
    PermissionDirective,
    FormsModule,
    ReactiveFormsModule,
    DatatableAutoResizeDirective,
    NgbModule
]   
})
export class PurchaseOrderModule { }
