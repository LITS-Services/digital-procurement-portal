import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FilterPipe } from './filter.pipe';
import { SearchPipe } from './search.pipe';
import { ShortNamePipe } from './short-name.pipe';
import { StatusTranslatePipe } from './status-translate.pipe';

@NgModule({
  declarations: [FilterPipe, SearchPipe, ShortNamePipe, StatusTranslatePipe],
  imports: [CommonModule],
  exports: [FilterPipe, SearchPipe, ShortNamePipe, StatusTranslatePipe]
})
export class PipeModule {}
