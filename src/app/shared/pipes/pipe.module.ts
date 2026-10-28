import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FilterPipe } from './filter.pipe';
import { SearchPipe } from './search.pipe';
import { ShortNamePipe } from './short-name.pipe';
import { StatusTranslatePipe } from './status-translate.pipe';
import { DatatableI18nDirective } from '../directives/datatable-i18n.directive';

@NgModule({
  declarations: [FilterPipe, SearchPipe, ShortNamePipe, StatusTranslatePipe, DatatableI18nDirective],
  imports: [CommonModule],
  exports: [FilterPipe, SearchPipe, ShortNamePipe, StatusTranslatePipe, DatatableI18nDirective]
})
export class PipeModule { }
