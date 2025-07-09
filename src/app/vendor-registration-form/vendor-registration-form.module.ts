import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VendorRegistrationFormRoutingModule } from './vendor-registration-form-routing.module';
import { VendorRegistrationFormComponent } from './vendor-registration-form/vendor-registration-form.component';
import { NgbAccordionModule, NgbDatepickerModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CustomFormsModule } from 'ngx-custom-validators';
import { MatchHeightModule } from 'app/shared/directives/match-height.directive';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ToastrModule } from 'ngx-toastr';
import { NgxSpinnerModule } from 'ngx-spinner';


@NgModule({
  declarations: [
    VendorRegistrationFormComponent
  ],
  imports: [
    CommonModule,
    VendorRegistrationFormRoutingModule,
    NgbModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    NgSelectModule,
    NgxDatatableModule,
    NgbAccordionModule,
    NgbDatepickerModule,
    ToastrModule.forRoot() ,
    NgxSpinnerModule,
  ]
})
export class VendorRegistrationFormModule { }
