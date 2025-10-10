import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RFQRoutingModule } from './rfq-routing.module';
import { RfqComponent } from './rfq/rfq.component';
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
import { RfqQuotationboxComponent } from './rfq-quotationbox/rfq-quotationbox.component';
import { RfqVendorModalComponent } from './rfq-vendor-modal/rfq-vendor-modal.component';
import { VendorComparisionComponent } from './vendor-comparision/vendor-comparision.component';
import { NewRfqComponent } from './new-rfq/new-rfq.component';
import { RfqAttachmentComponent } from './rfq-attachment/rfq-attachment.component';
import { RfqRemarksComponent } from './rfq-remarks/rfq-remarks.component';
import { RfqApprovalHistoryComponent } from './rfq-approval-history/rfq-approval-history.component';
import { AgmCoreModule } from "@agm/core";


@NgModule({
  declarations: [
    RfqComponent,
    RfqQuotationboxComponent,
    RfqVendorModalComponent,
    VendorComparisionComponent,
    NewRfqComponent,
    RfqAttachmentComponent,
    RfqRemarksComponent,
    RfqApprovalHistoryComponent
  ],
  imports: [
    CommonModule,
    RFQRoutingModule,
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
    AgmCoreModule
]
})
export class RFQModule { }
