import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SetupRoutingModule } from './setup-routing.module';
import { WorkflowMasterSetupComponent } from './workflow-master-setup/workflow-master-setup.component';
import { NewWorkflowmasterSetupComponent } from './new-workflowmaster-setup/new-workflowmaster-setup.component';
import { PurchaseRequestRoutingModule } from 'app/purchase-request/purchase-request-routing.module';
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
import { WorkflowApproverSetupComponent } from './workflow-approver-setup/workflow-approver-setup.component';
import { EmailSetupComponent } from './email-setup/email-setup.component';
import { CreateInvitationComponent } from './create-invitation/create-invitation.component';
import { EmailTemplateListComponent } from './email-template-list/email-template-list.component';
import { CreatEmailTemplateComponent } from './creat-email-template/creat-email-template.component';
import { AutoResizeDatatableDirective } from 'app/shared/directives/table-auto-resize.directive';


@NgModule({
  declarations: [
    WorkflowMasterSetupComponent,
    NewWorkflowmasterSetupComponent,
    WorkflowApproverSetupComponent,
    EmailSetupComponent,
    CreateInvitationComponent,
    EmailTemplateListComponent,
    CreatEmailTemplateComponent
  ],
  imports: [
    CommonModule,
    SetupRoutingModule,
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
        ToastrModule.forRoot() ,
        NgxSpinnerModule,
        AutoResizeDatatableDirective
  ]
})
export class SetupModule { }
