import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { InventoryTransferListComponent } from "./inventory-transfer-list/inventory-transfer-list.component";

const routes: Routes = [
  {
    path: '',
    component: InventoryTransferListComponent,
    // canActivate: [AclGuard],
    // data: {
    //   formTypeId: FORM_IDS.PURCHASE_ORDER,
    //   action: 'read',
    // },
  },
  {
    path: 'inventory-transfer-list',
    component: InventoryTransferListComponent,
    // canActivate: [AclGuard],
    // data: {
    //   title: 'Purchase Order Details',
    //   formTypeId: FORM_IDS.PURCHASE_ORDER,
    //   action: 'read',
    // },
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventoryTransferRoutingModule { }