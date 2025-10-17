import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GlobalConfigurationComponent } from './global-configuration/global-configuration.component';
import { NewGlobalConfigurationComponent } from './new-global-configuration/new-global-configuration.component';
import { LogsComponent } from './logs/logs.component';

const routes: Routes = [

  {
    path: '',
    children: [
      {
        path: 'global',
        component: GlobalConfigurationComponent,

      },
      {
        path: 'global/new-global-config', 
        component: NewGlobalConfigurationComponent,
      },
      // {
      //   path: 'exception-logs',
      //   component: ExceptionLogsComponent,

      // },
      // {
      //   path: 'http-logs',
      //   component: HttpLogsComponent,

      // },
      {
        path: 'logs',
        component: LogsComponent,

      },
    ]
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConfigurationRoutingModule { }
