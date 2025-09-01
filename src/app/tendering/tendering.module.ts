import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TenderingRoutingModule } from './tendering-routing.module';
import { TenderingComponent } from './tendering/tendering.component';
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
import { NewTenderingRequestComponent } from './new-tendering-request/new-tendering-request.component';


@NgModule({
  declarations: [
    TenderingComponent,
    NewTenderingRequestComponent
  ],
  imports: [
    CommonModule,
    TenderingRoutingModule,
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
    ToastrModule.forRoot() ,
    NgxSpinnerModule,
  ]
})
export class TenderingModule { }
