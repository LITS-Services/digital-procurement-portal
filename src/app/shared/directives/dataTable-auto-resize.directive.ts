import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnDestroy
} from '@angular/core';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Directive({
  selector: '[appDatatableAutoResize]'
})
export class DatatableAutoResizeDirective
  implements AfterViewInit, OnDestroy {

  @Input() datatable!: DatatableComponent;

  private resizeObserver?: ResizeObserver;
  private windowResizeSub?: Subscription;

  constructor(
    private host: ElementRef<HTMLElement>,
    private zone: NgZone
  ) {}

  ngAfterViewInit(): void {
    if (!this.datatable) return;

    this.zone.runOutsideAngular(() => {
      /** 1️⃣ Observe container size (sidebar collapse/expand) */
      this.resizeObserver = new ResizeObserver(() => {
        this.recalculate();
      });

      this.resizeObserver.observe(this.host.nativeElement);

      /** 2️⃣ Observe window resize (zoom / browser resize) */
      this.windowResizeSub = fromEvent(window, 'resize')
        .pipe(debounceTime(100))
        .subscribe(() => {
          this.recalculate();
        });
    });

    /** Initial recalculation */
    setTimeout(() => this.recalculate(), 0);
  }

  private recalculate(): void {
    this.zone.run(() => {
      this.datatable.recalculate();
      this.datatable.recalculateColumns();
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.windowResizeSub?.unsubscribe();
  }
}
