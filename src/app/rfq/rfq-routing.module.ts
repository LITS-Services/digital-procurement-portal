import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RfqComponent } from './rfq/rfq.component';

const routes: Routes = [
  {
    path: '',
    component: RfqComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RFQRoutingModule { }
