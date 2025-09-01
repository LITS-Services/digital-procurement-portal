import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TenderingComponent } from './tendering/tendering.component';
import { NewTenderingRequestComponent } from './new-tendering-request/new-tendering-request.component';

const routes: Routes = [
  {
    path: '',
    component: TenderingComponent,
  },
  {
    path: 'new-tendering',
    component: NewTenderingRequestComponent,
    data: {
      title: 'New Tendering Request',
      system: 'New Tendering Request'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TenderingRoutingModule { }
