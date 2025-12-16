import {
  AfterViewInit,
  Directive,
  EventEmitter,
  Input,
  OnDestroy,
  Output
} from '@angular/core';
import { Subscription, fromEvent, merge } from 'rxjs';
import { auditTime, distinctUntilChanged, map, skip } from 'rxjs/operators';
import { ConfigService } from 'app/shared/services/config.service';
import { LayoutService } from 'app/shared/services/layout.service';

@Directive({
  selector: 'ngx-datatable[autoResize]',
  standalone: true
})
export class AutoResizeDatatableDirective implements AfterViewInit, OnDestroy {

  /** Sidebar animation duration (ms) */
  @Input() autoResizeDelay = 350;

  /** Tell host component to rebuild datatable (*ngIf flip) */
  @Output() autoResize = new EventEmitter<void>();

  private sub?: Subscription;

  constructor(
    private configService: ConfigService,
    private layoutService: LayoutService
  ) {}

  ngAfterViewInit(): void {

    // 1) collapse / uncollapse (desktop)
    const collapsed$ = this.configService.templateConf$.pipe(
      map(conf => !!conf?.layout?.sidebar?.collapsed),
      distinctUntilChanged(),
      skip(1)
    );

    // 2) small screen show/hide sidebar (your navbar toggleSidebar())
    // toggleSidebar$ emits "isShow" (based on your code: hideSidebar = !isShow)
    const smallScreenToggle$ = this.layoutService.toggleSidebar$.pipe(
      distinctUntilChanged(),
      skip(1)
    );

    // 3) any window resize (optional but very useful)
    const windowResize$ = fromEvent(window, 'resize').pipe(
      auditTime(150) // avoid spamming
    );

    this.sub = merge(collapsed$, smallScreenToggle$, windowResize$)
      .pipe(auditTime(50))
      .subscribe(() => {
        setTimeout(() => this.autoResize.emit(), this.autoResizeDelay);
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
