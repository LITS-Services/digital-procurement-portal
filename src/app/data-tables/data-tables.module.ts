import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";

import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { DataTablesRoutingModule } from "./data-tables-routing.module";

import { DataTablesComponent } from './data-tables.component';
import { PipeModule } from 'app/shared/pipes/pipe.module';
import { CustomSelectDirective } from 'app/shared/directives/custom-select.directive';

@NgModule({
    imports: [
        CommonModule,
        DataTablesRoutingModule,
        NgxDatatableModule,
        PipeModule,
        CustomSelectDirective
    ],
    declarations: [
      DataTablesComponent
    ]
})
export class DataTablesModule { }
