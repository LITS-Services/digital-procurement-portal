import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { ReportsRoutingModule } from './reports-routing.module';
import { SpendAnalysisComponent } from './spend-analysis/spend-analysis.component';
import { PoDeliveryTrackingComponent } from './po-delivery-tracking/po-delivery-tracking.component';
import { CustomSelectDirective } from 'app/shared/directives/custom-select.directive';

@NgModule({
  schemas: [NO_ERRORS_SCHEMA],
  declarations: [
    SpendAnalysisComponent,
    PoDeliveryTrackingComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgApexchartsModule,
    NgxDatatableModule,
    OverlayModule,
    CustomSelectDirective,
    ReportsRoutingModule
  ]
})
export class ReportsModule { }
