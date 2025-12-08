import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryTransferRoutingModule } from './inventory-transfer-routing.module';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { AutoResizeDatatableDirective } from 'app/shared/directives/table-auto-resize.directive';
import { PermissionDirective } from 'app/shared/permissions/permission.directive';
import { InventoryTransferListComponent } from './inventory-transfer-list/inventory-transfer-list.component';



@NgModule({
  declarations: [
    InventoryTransferListComponent
  ],
  imports: [
    CommonModule,
    InventoryTransferRoutingModule,
    NgxDatatableModule,
    AutoResizeDatatableDirective,
    PermissionDirective
  ]
})
export class InventoryTransferModule { }
