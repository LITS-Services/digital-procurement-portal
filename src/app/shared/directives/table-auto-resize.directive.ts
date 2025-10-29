// auto-resize-datatable.directive.ts
import {
  AfterViewInit, Directive, ElementRef, Host, Input, NgZone, OnDestroy
} from '@angular/core';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Directive({
  selector: 'ngx-datatable[autoResize]',
  standalone: true
})
export class AutoResizeDatatableDirective implements AfterViewInit, OnDestroy {
  @Input() autoResizeInitDelay = 150;   // initial kick after view settles
  @Input() autoResizeDebounce = 300;    // debounce for resizes (ms)

  private ro?: ResizeObserver;
  private winSub?: Subscription;
  private initTimer?: any;

  constructor(
    @Host() private table: DatatableComponent,
    private el: ElementRef<HTMLElement>,
    private zone: NgZone
  ) {}

  ngAfterViewInit(): void {
    // 1) Initial recalc (inside Angular so bindings update correctly)
    this.initTimer = setTimeout(() => this.safeRecalc(true), this.autoResizeInitDelay);

    // 2) Observe the container that actually changes width (usually parent)
    const container = this.el.nativeElement.parentElement ?? this.el.nativeElement;
    if ('ResizeObserver' in window && container) {
      this.ro = new ResizeObserver(() => this.debouncedRecalc());
      this.ro.observe(container);
    }

    // 3) Also listen to window resizes (fallback / zoom / sidebar toggles)
    this.zone.runOutsideAngular(() => {
      this.winSub = fromEvent(window, 'resize')
        .pipe(debounceTime(this.autoResizeDebounce))
        .subscribe(() => this.safeRecalc());
    });
  }

  private debouncedRecalc() {
    // container observer can be very chatty → debounce with rAF
    requestAnimationFrame(() => this.safeRecalc());
  }

  private safeRecalc(force = false) {
    // run inside Angular to avoid timing glitches in some layouts
    this.zone.run(() => {
      try { this.table.recalculate(); } catch {}
      if (force) {
        // some layouts need a nudge so sticky headers / virtual scroller measure again
        try { window.dispatchEvent(new Event('resize')); } catch {}
      }
    });
  }

  ngOnDestroy(): void {
    if (this.ro) { try { this.ro.disconnect(); } catch {} }
    if (this.winSub) { this.winSub.unsubscribe(); }
    if (this.initTimer) { clearTimeout(this.initTimer); }
  }
}
