import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PurchaseRequestRoutingModule } from './purchase-request-routing.module';
import { PurchaseRequestComponent } from './purchase-request-master/purchase-request.component';
import { ArchwizardModule } from 'angular-archwizard';
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
import { PurchaseRequestApprovalComponent } from './purchase-request-approval/purchase-request-approval.component';
import { NewPurchaseRequestComponent } from './new-purchase-request/new-purchase-request.component';
import { PurchaseRequestRemarksComponent } from './purchase-request-remarks/purchase-request-remarks.component';
import { PrApprovalHistoryComponent } from './pr-approval-history/pr-approval-history.component';
import { SharedModule } from 'app/shared/shared.module';
import { AutoResizeDatatableDirective } from 'app/shared/directives/table-auto-resize.directive';
import { PermissionDirective } from 'app/shared/permissions/permission.directive';


@NgModule({
  imports: [
    CommonModule,
    PurchaseRequestRoutingModule,
    ArchwizardModule,
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
    AutoResizeDatatableDirective,
    PermissionDirective
  ],
  declarations: [
    PurchaseRequestComponent,
    PurchaseRequestApprovalComponent,
    NewPurchaseRequestComponent,
    PurchaseRequestApprovalComponent,
    PurchaseRequestRemarksComponent,
    PrApprovalHistoryComponent
  ],
})
export class PurchaseRequestModule { }
