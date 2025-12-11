import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from "@angular/common";

import { NgChartsModule } from 'ng2-charts';
import { ChartistModule} from 'ng-chartist';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NgApexchartsModule } from "ng-apexcharts";
import { ChartsRoutingModule } from "./charts-routing.module";

import { ChartistComponent } from "./chartist/chartist.component";
import { ChartjsComponent } from "./chartjs/chartjs.component";
import { NGXChartsComponent } from "./ngx-charts/ngx-charts.component";
import { ApexComponent } from './apex/apex.component';

@NgModule({
    imports: [
        CommonModule,
        ChartsRoutingModule,
        NgChartsModule,
        // ChartistModule, // Incompatible with Angular 21
        // NgxChartsModule, // May have compatibility issues with Angular 21
        NgApexchartsModule,
    ],
    declarations: [
        ChartistComponent,
        ChartjsComponent,
        NGXChartsComponent,
        ApexComponent
    ],
    schemas: [NO_ERRORS_SCHEMA]
})
export class ChartsNg2Module { }
