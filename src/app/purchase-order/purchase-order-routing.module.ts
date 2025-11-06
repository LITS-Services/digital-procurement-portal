import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PurchaseOrderListComponent } from './purchase-order-list/purchase-order-list.component';
import { PurchaseOrderDetailsComponent } from './purchase-order-details/purchase-order-details.component';

const routes: Routes = [
  {
    path: '',
    component: PurchaseOrderListComponent,
  },
  {
  path: ':id',
  component: PurchaseOrderDetailsComponent
}

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PurchaseOrderRoutingModule { }
