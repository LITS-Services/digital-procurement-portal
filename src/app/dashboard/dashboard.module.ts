import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from "@angular/common";

import { DashboardRoutingModule } from "./dashboard-routing.module";
import { ChartistModule } from 'ng-chartist';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AngularResizedEventModule } from 'angular-resize-event';
import { MatchHeightModule } from "../shared/directives/match-height.directive";

import { Dashboard1Component } from "./dashboard1/dashboard1.component";
import { Dashboard2Component } from "./dashboard2/dashboard2.component";
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
    imports: [
        CommonModule,
        DashboardRoutingModule,
        // ChartistModule, // Incompatible with Angular 21
        NgbModule,
        MatchHeightModule,
        NgApexchartsModule,
        // AngularResizedEventModule, // Incompatible with Angular 21
        TranslateModule,
    ],
    exports: [],
    declarations: [
        Dashboard1Component,
        Dashboard2Component
    ],
    providers: [],
    schemas: [NO_ERRORS_SCHEMA]
})
export class DashboardModule { }
