import { ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ComponentRef,
  Directive,
  DoCheck,
  ElementRef,
  HostListener,
  Inject,
  NgZone,
  OnDestroy,
  Optional,
  PLATFORM_ID,
  Self
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  CustomSelectOptionItem,
  CustomSelectPanelComponent
} from '../components/custom-select-panel/custom-select-panel.component';

const COPIED_CLASSES = [
  'form-control',
  'form-control-sm',
  'form-control-lg',
  'custom-input',
  'custom-select',
  'form-select',
  'w-cstm',
  'd-inline-block',
  'w-100',
  'width-100',
  'mt-1',
  'mt-2',
  'mb-1',
  'mb-2',
  'mx-1',
  'me-1',
  'mr-1',
  'filter-label',
  'chart-range-select',
  'project-filter-select'
];

@Directive({
  selector: 'select:not([multiple]):not([nativeSelect])',
  standalone: true
})
export class CustomSelectDirective implements AfterViewInit, DoCheck, OnDestroy {
  private triggerBtn?: HTMLButtonElement;
  private triggerTextEl?: HTMLSpanElement;
  private overlayRef?: OverlayRef;
  private panelRef?: ComponentRef<CustomSelectPanelComponent>;
  private overlaySubs = new Subscription();
  private mutationObserver?: MutationObserver;
  private isBrowser: boolean;
  private isDestroyed = false;

  private lastSelectedIndex = -999;
  private lastSelectedText = '';
  private lastDisabled = false;
  private lastInvalid = false;
  private lastNgInvalid = false;
  private lastNgTouched = false;
  private lastOptionsSignature = '';

  private readonly onTriggerClickBound = () => this.zone.run(() => this.toggle());
  private readonly onTriggerKeyDownBound = (event: KeyboardEvent) =>
    this.zone.run(() => this.handleKeyDown(event));
  private readonly onSelectFocusBound = () => this.triggerBtn?.focus();

  constructor(
    private el: ElementRef<HTMLSelectElement>,
    private overlay: Overlay,
    private zone: NgZone,
    @Inject(PLATFORM_ID) platformId: object,
    @Optional() @Self() private ngControl?: NgControl
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    const select = this.el.nativeElement;
    if (!select.parentNode) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'app-select-trigger';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');

    for (const cls of COPIED_CLASSES) {
      if (select.classList.contains(cls)) {
        btn.classList.add(cls);
      }
    }

    // Copy any arbitrary classes excluding hidden/Angular internal classes
    for (let i = 0; i < select.classList.length; i++) {
      const cls = select.classList.item(i);
      if (
        cls &&
        cls !== 'app-native-select-hidden' &&
        !cls.startsWith('ng-') &&
        !btn.classList.contains(cls)
      ) {
        btn.classList.add(cls);
      }
    }

    if (select.style.width) {
      btn.style.width = select.style.width;
    }

    const textSpan = document.createElement('span');
    textSpan.className = 'app-select-trigger__text';

    const icon = document.createElement('i');
    icon.className = 'ft ft-chevron-down app-select-trigger__icon';
    icon.setAttribute('aria-hidden', 'true');

    btn.appendChild(textSpan);
    btn.appendChild(icon);

    select.classList.add('app-native-select-hidden');
    select.tabIndex = -1;
    select.parentNode.insertBefore(btn, select.nextSibling);

    this.triggerBtn = btn;
    this.triggerTextEl = textSpan;

    btn.addEventListener('click', this.onTriggerClickBound);
    btn.addEventListener('keydown', this.onTriggerKeyDownBound);
    select.addEventListener('focus', this.onSelectFocusBound);

    this.mutationObserver = new MutationObserver(() => {
      this.zone.run(() => {
        this.syncTriggerState();
        if (this.panelRef) {
          this.panelRef.instance.setItems(
            this.readOptions(),
            this.getDirection(),
            this.getSearchPlaceholder()
          );
        }
      });
    });
    this.mutationObserver.observe(select, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });

    this.syncTriggerState();
  }

  @HostListener('change')
  onNativeChange(): void {
    this.syncTriggerState();
  }

  ngDoCheck(): void {
    if (!this.triggerBtn) return;
    const select = this.el.nativeElement;
    const idx = select.selectedIndex;
    const selectedOpt = idx >= 0 ? select.options[idx] : undefined;
    const text = (selectedOpt?.textContent ?? '').trim();
    const disabled = select.disabled;
    const isInvalid = select.classList.contains('is-invalid');
    const ngInvalid = select.classList.contains('ng-invalid');
    const ngTouched = select.classList.contains('ng-touched');

    if (
      idx !== this.lastSelectedIndex ||
      text !== this.lastSelectedText ||
      disabled !== this.lastDisabled ||
      isInvalid !== this.lastInvalid ||
      ngInvalid !== this.lastNgInvalid ||
      ngTouched !== this.lastNgTouched
    ) {
      this.syncTriggerState();
    }
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.close(false);
    this.mutationObserver?.disconnect();

    const select = this.el.nativeElement;
    select.removeEventListener('focus', this.onSelectFocusBound);
    select.classList.remove('app-native-select-hidden');

    if (this.triggerBtn) {
      this.triggerBtn.removeEventListener('click', this.onTriggerClickBound);
      this.triggerBtn.removeEventListener('keydown', this.onTriggerKeyDownBound);
      this.triggerBtn.remove();
      this.triggerBtn = undefined;
    }
  }

  private toggle(): void {
    if (this.overlayRef) {
      this.close(true);
    } else {
      this.open();
    }
  }

  private open(): void {
    const select = this.el.nativeElement;
    if (!this.triggerBtn || select.disabled || this.overlayRef) return;

    const triggerRect = this.triggerBtn.getBoundingClientRect();
    const dir = this.getDirection();

    const positions: ConnectedPosition[] =
      dir === 'rtl'
        ? [
            { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
            { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 },
            { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
            { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 }
          ]
        : [
            { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
            { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
            { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
            { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 }
          ];

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.triggerBtn)
      .withPositions(positions)
      .withPush(true);

    const triggerWidth = Math.round(triggerRect.width);
    const viewportMax = Math.max(window.innerWidth - 24, triggerWidth);
    const minWidth = Math.min(Math.max(triggerWidth, 200), viewportMax);
    const maxWidth = Math.min(Math.max(triggerWidth + 250, 650), viewportMax);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: false,
      minWidth,
      maxWidth,
      panelClass: 'app-select-overlay-pane'
    });
    this.overlayRef.setDirection(dir);

    const portal = new ComponentPortal(CustomSelectPanelComponent);
    this.panelRef = this.overlayRef.attach(portal);
    this.panelRef.instance.setItems(this.readOptions(), dir, this.getSearchPlaceholder());

    const panelEl = this.panelRef.location.nativeElement as HTMLElement;
    panelEl.style.display = 'block';
    panelEl.style.width = '100%';
    panelEl.style.minWidth = `${minWidth}px`;
    panelEl.style.boxSizing = 'border-box';

    if (this.overlayRef.overlayElement) {
      this.overlayRef.overlayElement.style.minWidth = `${minWidth}px`;
    }

    this.triggerBtn.setAttribute('aria-expanded', 'true');
    this.triggerBtn.classList.add('app-select-trigger--open');

    this.overlaySubs = new Subscription();

    this.overlaySubs.add(
      this.panelRef.instance.optionSelected.subscribe((item) => {
        this.selectOption(item);
      })
    );

    this.overlaySubs.add(
      this.panelRef.instance.closeRequested.subscribe(() => {
        this.close(true);
        this.triggerBtn?.focus();
      })
    );

    this.overlaySubs.add(
      this.overlayRef.outsidePointerEvents().subscribe((event) => {
        const target = event.target as Node | null;
        if (target && this.triggerBtn?.contains(target)) {
          return;
        }
        this.close(true);
      })
    );

    this.overlaySubs.add(
      this.overlayRef.keydownEvents().subscribe((event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.close(false);
          this.triggerBtn?.focus();
        }
      })
    );
  }

  private close(emitBlur: boolean): void {
    this.overlaySubs.unsubscribe();
    this.overlaySubs = new Subscription();

    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
      this.panelRef = undefined;
    }

    if (this.triggerBtn) {
      this.triggerBtn.setAttribute('aria-expanded', 'false');
      this.triggerBtn.classList.remove('app-select-trigger--open');
    }

    if (emitBlur && !this.isDestroyed) {
      this.ngControl?.control?.markAsTouched();
      this.el.nativeElement.dispatchEvent(new Event('blur', { bubbles: false }));
    }
  }

  private selectOption(item: CustomSelectOptionItem): void {
    const select = this.el.nativeElement;
    const option = select.options[item.index];
    if (!option || option.disabled) {
      this.close(true);
      return;
    }

    const changed = select.selectedIndex !== item.index;
    select.selectedIndex = item.index;
    option.selected = true;

    this.syncTriggerState();
    this.close(false);
    this.triggerBtn?.focus();

    this.ngControl?.control?.markAsTouched();
    if (changed) {
      select.dispatchEvent(new Event('change', { bubbles: true }));
      select.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (!this.isDestroyed) {
      select.dispatchEvent(new Event('blur', { bubbles: false }));
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const select = this.el.nativeElement;
    if (select.disabled) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.overlayRef) {
          this.open();
        } else {
          this.panelRef?.instance.moveHighlight(1);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (!this.overlayRef) {
          this.open();
        } else {
          this.panelRef?.instance.moveHighlight(-1);
        }
        break;

      case 'Enter':
      case ' ':
        if (this.overlayRef) {
          event.preventDefault();
          this.panelRef?.instance.selectHighlighted();
        } else if (event.key === ' ') {
          event.preventDefault();
          this.open();
        }
        break;

      case 'Escape':
        if (this.overlayRef) {
          event.preventDefault();
          this.close(false);
        }
        break;

      case 'Tab':
        if (this.overlayRef) {
          this.close(true);
        }
        break;

      default:
        if (
          this.overlayRef &&
          event.key.length === 1 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          this.panelRef?.instance.highlightByChar(event.key);
        }
        break;
    }
  }

  private syncTriggerState(): void {
    if (!this.triggerBtn || !this.triggerTextEl) return;

    const select = this.el.nativeElement;
    const idx = select.selectedIndex;
    const selectedOpt = idx >= 0 ? select.options[idx] : undefined;
    const text = (selectedOpt?.textContent ?? '').trim();
    const disabled = select.disabled;
    const isInvalid = select.classList.contains('is-invalid');
    const ngInvalid = select.classList.contains('ng-invalid');
    const ngTouched = select.classList.contains('ng-touched');

    this.lastSelectedIndex = idx;
    this.lastSelectedText = text;
    this.lastDisabled = disabled;
    this.lastInvalid = isInvalid;
    this.lastNgInvalid = ngInvalid;
    this.lastNgTouched = ngTouched;

    let displayText = text;
    if (!displayText && select.options.length > 0) {
      const firstOpt = select.options[0];
      if (firstOpt && (firstOpt.disabled || firstOpt.value === '' || firstOpt.value.endsWith('null'))) {
        displayText = (firstOpt.textContent ?? '').trim();
      }
    }

    this.triggerTextEl.textContent = displayText || 'Select';

    const isPlaceholder =
      !selectedOpt ||
      selectedOpt.disabled ||
      selectedOpt.value === '' ||
      !displayText ||
      (selectedOpt.index === 0 &&
        (selectedOpt.value.endsWith('null') || displayText.startsWith('--') || displayText === 'Select'));

    this.triggerBtn.classList.toggle('app-select-trigger--placeholder', isPlaceholder);
    this.triggerBtn.disabled = disabled;
    this.triggerBtn.classList.toggle('app-select-trigger--disabled', disabled);
    this.triggerBtn.classList.toggle('is-invalid', isInvalid);
    this.triggerBtn.classList.toggle('ng-invalid', ngInvalid);
    this.triggerBtn.classList.toggle('ng-touched', ngTouched);

    const sig = Array.from(select.options)
      .map((o) => `${o.index}:${o.textContent}:${o.disabled}:${o.hidden}`)
      .join('|');
    if (sig !== this.lastOptionsSignature) {
      this.lastOptionsSignature = sig;
      if (this.panelRef) {
        this.panelRef.instance.setItems(
          this.readOptions(),
          this.getDirection(),
          this.getSearchPlaceholder()
        );
      }
    }
  }

  private readOptions(): CustomSelectOptionItem[] {
    const select = this.el.nativeElement;
    const selectedIdx = select.selectedIndex;
    const items: CustomSelectOptionItem[] = [];

    const pushOption = (opt: HTMLOptionElement, groupHeader?: string) => {
      if (opt.hidden || opt.style.display === 'none') return;
      const label = (opt.textContent ?? '').trim();
      if (!label && opt.disabled) return;
      items.push({
        index: opt.index,
        label: label || '-- None --',
        disabled: opt.disabled,
        selected: opt.index === selectedIdx,
        groupHeader
      });
    };

    for (const child of Array.from(select.children)) {
      if (child instanceof HTMLOptGroupElement) {
        let firstInGroup = true;
        for (const opt of Array.from(child.children)) {
          if (opt instanceof HTMLOptionElement && !opt.hidden && opt.style.display !== 'none') {
            pushOption(opt, firstInGroup ? child.label : undefined);
            firstInGroup = false;
          }
        }
      } else if (child instanceof HTMLOptionElement) {
        pushOption(child);
      }
    }

    return items;
  }

  private getDirection(): 'ltr' | 'rtl' {
    const htmlDir = document.documentElement.dir;
    if (htmlDir === 'rtl' || document.documentElement.classList.contains('rtl') || document.body.classList.contains('rtl')) {
      return 'rtl';
    }
    return 'ltr';
  }

  private getSearchPlaceholder(): string {
    const select = this.el.nativeElement;

    const placeholderAttr = select.getAttribute('placeholder');
    if (placeholderAttr) {
      const clean = placeholderAttr.replace(/^--\s*|\s*--$/g, '').trim();
      if (clean.toLowerCase().startsWith('select ')) {
        return `Search ${clean.slice(7).trim().toLowerCase()}...`;
      }
      return `Search ${clean.toLowerCase()}...`;
    }

    const labelEl =
      select.labels?.[0] ||
      select.closest('.form-field')?.querySelector('label') ||
      select.closest('.form-group')?.querySelector('label') ||
      select.closest('.filter-group')?.querySelector('label') ||
      select.closest('fieldset')?.querySelector('label') ||
      select.parentElement?.querySelector(':scope > label');

    if (labelEl) {
      const clone = labelEl.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.text-danger, small, i, svg, span.text-danger').forEach((n) => n.remove());
      const labelText = (clone.textContent ?? '').trim();
      if (labelText) {
        return `Search ${labelText.toLowerCase()}...`;
      }
    }

    if (select.options.length > 0) {
      const firstOpt = select.options[0];
      if (firstOpt && (firstOpt.disabled || firstOpt.hidden || firstOpt.value === '')) {
        const optText = (firstOpt.textContent ?? '').trim().replace(/^--\s*|\s*--$/g, '');
        if (optText.toLowerCase().startsWith('select ') && optText.length > 7) {
          return `Search ${optText.slice(7).trim().toLowerCase()}...`;
        }
      }
    }

    return 'Search...';
  }
}
