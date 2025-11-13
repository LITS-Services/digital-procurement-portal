import { NgModule } from '@angular/core';
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


@NgModule({
  declarations: [
    CompanyListingComponent,
    CompanyEditComponent,
    CompanyActionsComponent,
    CompanyApprovalHistoryComponent,
    AssignMeComponent
  ],
  imports: [
    CommonModule,
    CompanyRoutingModule,
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
    NgxDatatableModule,
    NgbAccordionModule,
    NgbDatepickerModule,
    ToastrModule.forRoot(),
    NgxSpinnerModule,
    AutoResizeDatatableDirective
  ]
})
export class CompanyModule { }
