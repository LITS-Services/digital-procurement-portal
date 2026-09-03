import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { Dashboard1Component } from "./dashboard1/dashboard1.component";
import { Dashboard2Component } from "./dashboard2/dashboard2.component";
import { DashboardResolver } from './resolver/dashboard.resolver';
import { AclGuard } from 'app/shared/permissions/acl.guard';
import { FORM_IDS } from 'app/shared/permissions/form-ids';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'dashboard1',
        component: Dashboard1Component,
        canActivate: [AclGuard],
        data: {
          title: 'Dashboard 1',
          formTypeId: FORM_IDS.DASHBOARD,
          action: 'read',
        },
        resolve: {
          companies: DashboardResolver
        }
      },
      {
        path: 'dashboard2',
        component: Dashboard2Component,
        canActivate: [AclGuard],
        data: {
          title: 'Dashboard 2',
          formTypeId: FORM_IDS.DASHBOARD,
          action: 'read',
        }
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule { }
