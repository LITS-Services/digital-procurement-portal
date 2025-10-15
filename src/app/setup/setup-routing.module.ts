import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WorkflowMasterSetupComponent } from './workflow-master-setup/workflow-master-setup.component';
import { NewWorkflowmasterSetupComponent } from './new-workflowmaster-setup/new-workflowmaster-setup.component';
import { EmailSetupComponent } from './email-setup/email-setup.component';
import { CreateInvitationComponent } from './create-invitation/create-invitation.component';

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

    ]
  }


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SetupRoutingModule { }
