import { Directive, OnInit, AfterViewInit, OnDestroy, Optional, ChangeDetectorRef } from '@angular/core';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Directive({
  selector: 'ngx-datatable',
  standalone: false
})
export class DatatableI18nDirective implements OnInit, AfterViewInit, OnDestroy {
  private sub?: Subscription;

  constructor(
    @Optional() private datatable: DatatableComponent,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.datatable) return;

    this.applyMessages();

    this.sub = this.translate.onLangChange.subscribe((_event: LangChangeEvent) => {
      this.applyMessages();
    });
  }

  ngAfterViewInit(): void {
    this.applyMessages();
  }

  private applyMessages(): void {
    if (!this.datatable) return;

    const currentMessages = this.datatable.messages || {};
    this.datatable.messages = {
      ...currentMessages,
      emptyMessage: this.translate.instant('DATATABLE.EMPTY_MESSAGE') || 'No data to display',
      totalMessage: this.translate.instant('DATATABLE.TOTAL_MESSAGE') || 'total',
      selectedMessage: this.translate.instant('DATATABLE.SELECTED_MESSAGE') || 'selected'
    };

    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}

