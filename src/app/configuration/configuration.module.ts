import { PipeModule } from 'app/shared/pipes/pipe.module';
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
import { HasPermissionDirective } from 'app/shared/auth/has-permission.directive';
import { NgbDropdownModule, NgbModalModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DatatableAutoResizeDirective } from 'app/shared/directives/dataTable-auto-resize.directive';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
  declarations: [
    GlobalConfigurationComponent,
    // ExceptionLogsComponent,
    // HttpLogsComponent,
    NewGlobalConfigurationComponent,
    LogsComponent
  ],
  imports: [
    PipeModule,
    CommonModule,
    ConfigurationRoutingModule,
    NgxDatatableModule,
    ReactiveFormsModule,
    AutoResizeDatatableDirective,
    NgbDropdownModule,
      NgbTooltipModule,
      DatatableAutoResizeDirective,
    PermissionDirective,
    HasPermissionDirective,
    TranslateModule
  ]
})
export class ConfigurationModule { }
