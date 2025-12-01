import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WorkflowMasterSetupComponent } from './workflow-master-setup/workflow-master-setup.component';
import { NewWorkflowmasterSetupComponent } from './new-workflowmaster-setup/new-workflowmaster-setup.component';
import { EmailSetupComponent } from './email-setup/email-setup.component';
import { CreateInvitationComponent } from './create-invitation/create-invitation.component';
import { EmailTemplateListComponent } from './email-template-list/email-template-list.component';
import { VendorOnboardingSetupComponent } from './vendor-onboarding-setup/vendor-onboarding-setup.component';
import { NewVendorOnboardingComponent } from './new-vendor-onboarding/new-vendor-onboarding.component';
import { AclSetupComponent } from './acl-setup/acl-setup.component';
import { AclGuard } from 'app/shared/permissions/acl.guard';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { CreateEmailTemplateComponent } from './create-email-template/create-email-template.component';

const routes: Routes = [

  {
    path: '',
    children: [
      {
        path: 'workflow',
        component: WorkflowMasterSetupComponent,
        canActivate: [AclGuard],
        data: {
          title: 'Workflow Setup',
          formTypeId: FORM_IDS.WORKFLOW_SETUP,
          action: 'read',
        }
      },
      {
        path: 'create-workflow',
        component: NewWorkflowmasterSetupComponent,
        canActivate: [AclGuard],
        data: {
          title: 'Create Workflow Setup',
          formTypeId: FORM_IDS.WORKFLOW_SETUP,
          action: 'read',
        }
      },

      {
        path: 'email-setup',
        component: EmailSetupComponent,
        canActivate: [AclGuard],
        data: {
          title: 'Email Setup',
          formTypeId: FORM_IDS.INVITATION,
          action: 'read',
        }
      },
      {
        path: 'create-invitation',
        component: CreateInvitationComponent,
        canActivate: [AclGuard],
        data: {
          title: 'Create Invitation',
          formTypeId: FORM_IDS.INVITATION,
          action: 'read',
        }
      },

      {
        path: 'email-templatelist',
        component: EmailTemplateListComponent,
        canActivate: [AclGuard],
        data: {
          title: 'Email Template List',
          formTypeId: FORM_IDS.EMAIL_TEMPLATE_LIST,
          action: 'read',
        }
      },
      {
        path: 'create-email-template',
        component: CreateEmailTemplateComponent,
        canActivate: [AclGuard],
        data: {
          title: 'Create Email Template',
          formTypeId: FORM_IDS.EMAIL_TEMPLATE_LIST,
          action: 'read',
        }
      },
      {
        path: 'vendor-onboarding-setup',
        component: VendorOnboardingSetupComponent,
        canActivate: [AclGuard],
        data: {
          title: 'Vendor Onboarding Setup',
          formTypeId: FORM_IDS.VENDOR_ONBOARDING,
          action: 'read',
        }
      },
      {
        path: 'create-vendor-onboarding',
        component: NewVendorOnboardingComponent,
        canActivate: [AclGuard],
        data: {
          title: 'Create Vendor Onboarding',
          formTypeId: FORM_IDS.VENDOR_ONBOARDING,
          action: 'read',
        }
      },
      {
        path: 'acl',
        component: AclSetupComponent,
        canActivate: [AclGuard],
        data: {
          title: 'ACL',
          formTypeId: FORM_IDS.ACL,
          action: 'read',
        }
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SetupRoutingModule { }