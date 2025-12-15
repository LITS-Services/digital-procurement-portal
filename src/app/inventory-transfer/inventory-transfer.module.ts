import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryTransferRoutingModule } from './inventory-transfer-routing.module';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { AutoResizeDatatableDirective } from 'app/shared/directives/table-auto-resize.directive';
import { PermissionDirective } from 'app/shared/permissions/permission.directive';
import { InventoryTransferListComponent } from './inventory-transfer-list/inventory-transfer-list.component';
import { InventoryTransferForm } from './inventory-transfer-form/inventory-transfer-form';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    InventoryTransferListComponent,
    InventoryTransferForm
  ],
  imports: [
    CommonModule,
    InventoryTransferRoutingModule,
    NgxDatatableModule,
    AutoResizeDatatableDirective,
    PermissionDirective,
    NgbAccordionModule,
    ReactiveFormsModule
  ]
})
export class InventoryTransferModule { }
