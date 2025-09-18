import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProcurmentCompaniesComponent } from './procurment-companies/procurment-companies.component';
import { ProcurmentCompaniesEditComponent } from './procurment-companies-edit/procurment-companies-edit.component';

const routes: Routes = [

  {
    path: '',
    component: ProcurmentCompaniesComponent,
  },
  {
    path: 'procurment-companies-edit',
    component: ProcurmentCompaniesEditComponent,
  },


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProcurmentCompaniesRoutingModule { }
