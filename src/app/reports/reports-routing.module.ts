import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AclGuard } from 'app/shared/permissions/acl.guard';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { SpendAnalysisComponent } from './spend-analysis/spend-analysis.component';
import { PoDeliveryTrackingComponent } from './po-delivery-tracking/po-delivery-tracking.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'spend-analysis',
        component: SpendAnalysisComponent,
        canActivate: [AclGuard],
        data: {
          title: 'Spend Analysis Report',
          formTypeId: FORM_IDS.SPEND_ANALYSIS_REPORT,
          action: 'read'
        }
      },
      {
        path: 'po-delivery-tracking',
        component: PoDeliveryTrackingComponent,
        canActivate: [AclGuard],
        data: {
          title: 'PO and Delivery Tracking Report',
          formTypeId: FORM_IDS.PO_DELIVERY_TRACKING_REPORT,
          action: 'read'
        }
      },
      {
        path: '',
        redirectTo: 'spend-analysis',
        pathMatch: 'full'
      },
      {
        path: '**',
        redirectTo: 'spend-analysis'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
