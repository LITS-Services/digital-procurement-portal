import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RfqComponent } from './rfq/rfq.component';
import { NewRfqComponent } from './new-rfq/new-rfq.component';

const routes: Routes = [
  {
    path: '',
    component: RfqComponent,
  },

    {
      path: 'new-rfq',
      component: NewRfqComponent,
      data: {
        title: 'New RFQ Request',
        system: 'New RFQ Request'
      }
    },
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RFQRoutingModule { }
