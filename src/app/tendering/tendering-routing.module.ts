import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TenderingComponent } from './tendering/tendering.component';

const routes: Routes = [
  {
    path: '',
    component: TenderingComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TenderingRoutingModule { }
