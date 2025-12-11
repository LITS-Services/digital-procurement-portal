import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProcurmentCompaniesRoutingModule } from './procurment-companies-routing.module';
import { ProcurmentCompaniesComponent } from './procurment-companies/procurment-companies.component';
import { CompanyRoutingModule } from 'app/company/company-routing.module';
import { NgbAccordionModule, NgbDatepickerModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CustomFormsModule } from 'ngx-custom-validators';
import { MatchHeightModule } from 'app/shared/directives/match-height.directive';
import { UiSwitchModule } from 'ngx-ui-switch';
import { PipeModule } from 'app/shared/pipes/pipe.module';
import { QuillModule } from 'ngx-quill';
import { NgSelectModule } from '@ng-select/ng-select';
import { TagInputModule } from 'ngx-chips';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ToastrModule } from 'ngx-toastr';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ProcurmentCompaniesEditComponent } from './procurment-companies-edit/procurment-companies-edit.component';
import { AutoResizeDatatableDirective } from 'app/shared/directives/table-auto-resize.directive';
import { PermissionDirective } from 'app/shared/permissions/permission.directive';


@NgModule({
  declarations: [
    ProcurmentCompaniesEditComponent,
    ProcurmentCompaniesComponent  ],
  imports: [
    CommonModule,
    ProcurmentCompaniesRoutingModule,
     CommonModule,
        CompanyRoutingModule,
        NgbModule,
        ReactiveFormsModule,
        FormsModule,
        HttpClientModule,
        // CustomFormsModule, // Incompatible with Angular 21
        MatchHeightModule,
        NgbModule,
        // UiSwitchModule, // Incompatible with Angular 21
        PipeModule,
        QuillModule.forRoot(),
        NgSelectModule,
        // TagInputModule, // Incompatible with Angular 21
        NgxDatatableModule,
        NgbAccordionModule,
        NgbDatepickerModule,
        ToastrModule.forRoot(),
        NgxSpinnerModule,
        AutoResizeDatatableDirective,
        PermissionDirective
  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class ProcurmentCompaniesModule { }
