import { PipeModule } from 'app/shared/pipes/pipe.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryTransferRoutingModule } from './inventory-transfer-routing.module';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { AutoResizeDatatableDirective } from 'app/shared/directives/table-auto-resize.directive';
import { PermissionDirective } from 'app/shared/permissions/permission.directive';
import { InventoryTransferListComponent } from './inventory-transfer-list/inventory-transfer-list.component';
import { InventoryTransferForm } from './inventory-transfer-form/inventory-transfer-form';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatatableAutoResizeDirective } from 'app/shared/directives/dataTable-auto-resize.directive';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    InventoryTransferListComponent,
    InventoryTransferForm
  ],
  imports: [
    PipeModule,
    CommonModule,
    InventoryTransferRoutingModule,
    NgxDatatableModule,
    AutoResizeDatatableDirective,
    DatatableAutoResizeDirective,
    PermissionDirective,
    NgbAccordionModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule
  ]
})
export class InventoryTransferModule { }
