import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompanyListingComponent } from './company-listing/company-listing.component';
import { CompanyEditComponent } from './company-edit/company-edit.component';

const routes: Routes = [
  {
    path: '',
    component: CompanyListingComponent,
  },
  {
    path: 'company-edit',
    component: CompanyEditComponent,
    data: {
      title: 'Comapny Edit',
      system: 'Comapny Edit'
    }
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CompanyRoutingModule { }
