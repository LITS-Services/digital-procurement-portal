import { Directive, Input, OnChanges, SimpleChanges, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from './auth.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnChanges {
  @Input() hasPermission = '';

  constructor(
    private tpl: TemplateRef<unknown>,
    private vcr: ViewContainerRef,
    private auth: AuthService,
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    this.render();
  }

  private render(): void {
    this.vcr.clear();
    if (!this.hasPermission || this.auth.hasPermission(this.hasPermission)) {
      this.vcr.createEmbeddedView(this.tpl);
    }
  }
}
