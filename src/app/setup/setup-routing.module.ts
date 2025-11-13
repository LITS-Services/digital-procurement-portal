import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WorkflowMasterSetupComponent } from './workflow-master-setup/workflow-master-setup.component';
import { NewWorkflowmasterSetupComponent } from './new-workflowmaster-setup/new-workflowmaster-setup.component';
import { EmailSetupComponent } from './email-setup/email-setup.component';
import { CreateInvitationComponent } from './create-invitation/create-invitation.component';
import { EmailTemplateListComponent } from './email-template-list/email-template-list.component';
import { CreatEmailTemplateComponent } from './creat-email-template/creat-email-template.component';
import { VendorOnboardingSetupComponent } from './vendor-onboarding-setup/vendor-onboarding-setup.component';
import { NewVendorOnboardingComponent } from './new-vendor-onboarding/new-vendor-onboarding.component';
import { AclSetupComponent } from './acl-setup/acl-setup.component';

const routes: Routes = [

  {
    path: '',
    children: [
      {
        path: 'workflow',
        component: WorkflowMasterSetupComponent,
        data: {
          title: 'Workflow Setup'
        }
      },
      {
        path: 'create-workflow',
        component: NewWorkflowmasterSetupComponent,
        data: {
          title: 'Create Workflow Setup'
        }
      },

      {
        path: 'email-setup',
        component: EmailSetupComponent,
        data: {
          title: 'Email Setup'
        }
      },
      {
        path: 'create-invitation',
        component: CreateInvitationComponent,
        data: {
          title: 'Create Invitation'
        }
      },

      {
        path: 'email-templatelist',
        component: EmailTemplateListComponent,
        data: {
          title: 'Email Template List'
        }
      },
      {
        path: 'create-email-template',
        component: CreatEmailTemplateComponent,
        data: {
          title: 'Create Email Template'
        }
      },
      {
        path: 'vendor-onboarding-setup',
        component: VendorOnboardingSetupComponent,
        data: {
          title: 'Vendor Onboarding Setup'
        }
      },
      {
        path: 'create-vendor-onboarding',
        component: NewVendorOnboardingComponent,
        data: {
          title: 'Create Vendor Onboarding'
        }
      },
      {
        path: 'acl',
        component: AclSetupComponent,
        data: {
          title: 'ACL'
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
