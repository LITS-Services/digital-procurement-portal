import { Directive, ElementRef, HostListener, Input, OnChanges, Renderer2 } from '@angular/core';
import { PermissionService } from './permission.service';

@Directive({
    selector: '[appPermission]',
    standalone: true
})
export class PermissionDirective implements OnChanges {

    @Input('appPermDisable') action: 'read' | 'write' | 'delete' = 'read';

    /** formId to check against */
    @Input() appPermFormId!: number | string;

    /** if true, hide instead of disable */
    @Input() appPermHide = false;

    private allowed = false;

    constructor(private el: ElementRef, private rnd: Renderer2, private perms: PermissionService) { }

    ngOnChanges(): void {
        this.allowed = this.perms.can(this.appPermFormId, this.action);

        if (this.appPermHide) {
            // Hide entirely
            this.rnd.setStyle(this.el.nativeElement, 'display', this.allowed ? '' : 'none');
            return;
        }

        // Visual state
        if (this.allowed) {
            this.rnd.removeAttribute(this.el.nativeElement, 'disabled');
            this.rnd.setAttribute(this.el.nativeElement, 'aria-disabled', 'false');
            this.rnd.removeClass(this.el.nativeElement, 'pointer-events-none');
            this.rnd.removeStyle(this.el.nativeElement, 'background-color');
            this.rnd.removeStyle(this.el.nativeElement, 'box-shadow');
            this.rnd.removeStyle(this.el.nativeElement, 'color');
            this.rnd.removeAttribute(this.el.nativeElement, 'tabindex');
        } else {
            this.rnd.setAttribute(this.el.nativeElement, 'disabled', 'true');
            this.rnd.setAttribute(this.el.nativeElement, 'aria-disabled', 'true');
            this.rnd.addClass(this.el.nativeElement, 'pointer-events-none');
            this.rnd.setStyle(this.el.nativeElement, 'background-color', '#f2f4f6');
            this.rnd.setStyle(this.el.nativeElement, 'box-shadow', 'none');
            this.rnd.setStyle(this.el.nativeElement, 'color', '#94a3b8');
            // Prevent keyboard activation too
            this.rnd.setAttribute(this.el.nativeElement, 'tabindex', '-1');
        }
    }

    @HostListener('click', ['$event'])
    onClick(ev: Event) {
        if (!this.allowed) {
            // Block even if someone toggles attributes/styles in DevTools
            ev.preventDefault();
            ev.stopImmediatePropagation();
            return false as unknown as void;
        }
        return;
    }
}