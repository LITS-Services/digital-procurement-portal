import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CompanyRoutingModule } from './company-routing.module';
import { CompanyListingComponent } from './company-listing/company-listing.component';
import { CompanyEditComponent } from './company-edit/company-edit.component';
import { NgbAccordionModule, NgbDatepickerModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CustomFormsModule } from 'ngx-custom-validators';
import { MatchHeightModule } from 'app/shared/directives/match-height.directive';
import { UiSwitchModule } from 'ngx-ui-switch';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { TagInputModule } from 'ngx-chips';
import { NgSelectModule } from '@ng-select/ng-select';
import { QuillModule } from 'ngx-quill';
import { PipeModule } from 'app/shared/pipes/pipe.module';
import { CompanyActionsComponent } from './company-actions/company-actions.component';
import { AutoResizeDatatableDirective } from 'app/shared/directives/table-auto-resize.directive';
import { CompanyApprovalHistoryComponent } from './company-approval-history/company-approval-history.component';
import { AssignMeComponent } from './assign-me/assign-me.component';
import { CompanySetupHistoryComponent } from './company-setup-history/company-setup-history.component';


@NgModule({
  declarations: [
    CompanyListingComponent,
    CompanyEditComponent,
    CompanyActionsComponent,
    CompanyApprovalHistoryComponent,
    AssignMeComponent,
    CompanySetupHistoryComponent
  ],
  imports: [
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
    AutoResizeDatatableDirective
  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class CompanyModule { }
