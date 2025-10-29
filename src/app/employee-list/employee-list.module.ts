import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmployeeListRoutingModule } from './employee-list-routing.module';
import { EmployeeListComponent } from './employee-list/employee-list.component';

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
import { AutoResizeDatatableDirective } from 'app/shared/directives/table-auto-resize.directive';

@NgModule({
  declarations: [
    EmployeeListComponent
  ],
  imports: [
    CommonModule,
    EmployeeListRoutingModule,
            NgbModule,
            ReactiveFormsModule,
            FormsModule,
            HttpClientModule,
            CustomFormsModule,
            MatchHeightModule,
            NgbModule,
            UiSwitchModule,
            PipeModule,
            QuillModule.forRoot(),
            NgSelectModule,
            TagInputModule,
            NgxDatatableModule  ,
            NgbAccordionModule,
            NgbDatepickerModule,
            ToastrModule.forRoot(),
            NgxSpinnerModule,
            AutoResizeDatatableDirective
  ]
})
export class EmployeeListModule { }
