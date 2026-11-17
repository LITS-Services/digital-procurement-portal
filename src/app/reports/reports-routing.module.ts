import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SpendAnalysisComponent } from './spend-analysis/spend-analysis.component';
import { PoDeliveryTrackingComponent } from './po-delivery-tracking/po-delivery-tracking.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'spend-analysis',
        component: SpendAnalysisComponent,
        data: { title: 'Spend Analysis Report' }
      },
      {
        path: 'po-delivery-tracking',
        component: PoDeliveryTrackingComponent,
        data: { title: 'Purchase Order & Delivery Tracking' }
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
