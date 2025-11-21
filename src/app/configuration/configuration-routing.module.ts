import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GlobalConfigurationComponent } from './global-configuration/global-configuration.component';
import { NewGlobalConfigurationComponent } from './new-global-configuration/new-global-configuration.component';
import { LogsComponent } from './logs/logs.component';
import { AclGuard } from 'app/shared/permissions/acl.guard';
import { FORM_IDS } from 'app/shared/permissions/form-ids';

const routes: Routes = [

  {
    path: '',
    children: [
      {
        path: 'global',
        component: GlobalConfigurationComponent,
        canActivate: [AclGuard],
        data: {
          formTypeId: FORM_IDS.GLOBAL_CONFIGURATION,
          action: 'read',
        },
      },
      {
        path: 'global/new-global-config',
        component: NewGlobalConfigurationComponent,
        canActivate: [AclGuard],
        data: {
          formTypeId: FORM_IDS.GLOBAL_CONFIGURATION,
          action: 'read',
        },
      },
      {
        path: 'logs',
        component: LogsComponent,
        canActivate: [AclGuard],
        data: {
          formTypeId: FORM_IDS.LOGS,
          action: 'read',
        },
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConfigurationRoutingModule { }