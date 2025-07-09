import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VendorRegistrationFormComponent } from './vendor-registration-form/vendor-registration-form.component';

const routes: Routes = [
  {
    path: '',
    component: VendorRegistrationFormComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VendorRegistrationFormRoutingModule { }
