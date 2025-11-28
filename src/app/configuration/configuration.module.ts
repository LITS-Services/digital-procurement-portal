import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigurationRoutingModule } from './configuration-routing.module';
import { GlobalConfigurationComponent } from './global-configuration/global-configuration.component';
import { NgxDatatableModule } from "@swimlane/ngx-datatable";
import { NewGlobalConfigurationComponent } from './new-global-configuration/new-global-configuration.component';
import { ReactiveFormsModule } from '@angular/forms';
import { LogsComponent } from './logs/logs.component';
import { AutoResizeDatatableDirective } from 'app/shared/directives/table-auto-resize.directive';
import { PermissionDirective } from 'app/shared/permissions/permission.directive';
import { NgbDropdownModule, NgbModalModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  declarations: [
    GlobalConfigurationComponent,
    // ExceptionLogsComponent,
    // HttpLogsComponent,
    NewGlobalConfigurationComponent,
    LogsComponent
  ],
  imports: [
    CommonModule,
    ConfigurationRoutingModule,
    NgxDatatableModule,
    ReactiveFormsModule,
    AutoResizeDatatableDirective,
    NgbDropdownModule,
      NgbTooltipModule,
    PermissionDirective
]
})
export class ConfigurationModule { }
