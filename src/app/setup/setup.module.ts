import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
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
import { AutoResizeDatatableDirective } from 'app/shared/directives/table-auto-resize.directive';
import { VendorOnboardingSetupComponent } from './vendor-onboarding-setup/vendor-onboarding-setup.component';
import { NewVendorOnboardingComponent } from './new-vendor-onboarding/new-vendor-onboarding.component';
import { AclSetupComponent } from './acl-setup/acl-setup.component';
import { VendorOnboardingReceiversComponent } from './vendor-onboarding-receivers/vendor-onboarding-receivers.component';
import { PermissionDirective } from 'app/shared/permissions/permission.directive';
import { CreateEmailTemplateComponent } from './create-email-template/create-email-template.component';
import { BulkVendorOnboardingComponent } from './bulk-vendor-onboarding/bulk-vendor-onboarding.component';



@NgModule({
  declarations: [
    WorkflowMasterSetupComponent,
    NewWorkflowmasterSetupComponent,
    WorkflowApproverSetupComponent,
    EmailSetupComponent,
    CreateInvitationComponent,
    EmailTemplateListComponent,
    CreateEmailTemplateComponent,
    VendorOnboardingSetupComponent,
    NewVendorOnboardingComponent,
    AclSetupComponent,
    VendorOnboardingReceiversComponent,
    BulkVendorOnboardingComponent,
  ],
  imports: [
    CommonModule,
    SetupRoutingModule,
        CommonModule,
        PurchaseRequestRoutingModule,
        // ArchwizardModule, // Incompatible with Angular 21
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
        ToastrModule.forRoot() ,
        NgxSpinnerModule,
        AutoResizeDatatableDirective,
        PermissionDirective
  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class SetupModule { }
