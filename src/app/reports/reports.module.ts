import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgApexchartsModule } from 'ng-apexcharts';

import { ReportsRoutingModule } from './reports-routing.module';
import { SpendAnalysisComponent } from './spend-analysis/spend-analysis.component';
import { PoDeliveryTrackingComponent } from './po-delivery-tracking/po-delivery-tracking.component';

@NgModule({
  schemas: [NO_ERRORS_SCHEMA],
  declarations: [
    SpendAnalysisComponent,
    PoDeliveryTrackingComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgApexchartsModule,
    ReportsRoutingModule
  ]
})
export class ReportsModule { }
