import {
  AfterViewInit,
  Directive,
  EventEmitter,
  Input,
  OnDestroy,
  Output
} from '@angular/core';
import { Subscription, distinctUntilChanged, map, skip } from 'rxjs';
import { ConfigService } from 'app/shared/services/config.service';

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

  constructor(private configService: ConfigService) {}

  ngAfterViewInit(): void {
    this.sub = this.configService.templateConf$
      .pipe(
        map(conf => conf?.layout?.sidebar?.collapsed),
        distinctUntilChanged(),
        skip(1) // ⛔ skip initial emission (prevents first-load blink)
      )
      .subscribe(collapsed => {
        // ✅ Trigger on both sidebar collapse and uncollapse
        setTimeout(() => {
          this.autoResize.emit();
        }, this.autoResizeDelay);
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
