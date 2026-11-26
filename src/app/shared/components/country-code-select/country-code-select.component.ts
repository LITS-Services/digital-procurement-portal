import { ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  Output,
  PLATFORM_ID,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  DEFAULT_PHONE_COUNTRY_ISO,
  PHONE_COUNTRIES,
  PhoneCountryOption,
  getPhoneCountryByIso
} from '../../utils/phone-countries';

@Component({
  selector: 'app-country-code-select',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CountryCodeSelectComponent),
      multi: true
    }
  ],
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .cc-trigger {
      width: 100%;
      height: 42px;
      padding: 0 7px 0 8px;
      border-radius: 8px;
      border: 1.5px solid #D7D7D7;
      background-color: #ffffff;
      color: #2B2F33;
      font-size: 13px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
      cursor: pointer;
      direction: ltr;
      text-align: left;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
      box-sizing: border-box;
      user-select: none;
    }

    .cc-trigger:hover:not(:disabled):not(.is-invalid):not(.cc-trigger--open) {
      background-color: #f9fafb;
      border-color: #9ca3af;
    }

    .cc-trigger:focus,
    .cc-trigger--open {
      outline: none;
      border-color: #116AEF;
      background-color: #ffffff;
      box-shadow: 0 0 0 3px rgba(17, 106, 239, 0.12);
    }

    .cc-trigger.is-invalid {
      border-color: #dc3545 !important;
    }

    .cc-trigger.is-invalid:focus,
    .cc-trigger.is-invalid.cc-trigger--open {
      border-color: #dc3545 !important;
      box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.15) !important;
    }

    .cc-trigger:disabled {
      background-color: #f3f4f6;
      border-color: #e5e7eb;
      color: #6b7280;
      cursor: not-allowed;
      opacity: 1;
    }

    .cc-trigger__value {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      overflow: hidden;
    }

    .cc-flag {
      width: 20px;
      height: 14px;
      object-fit: cover;
      border-radius: 2px;
      flex-shrink: 0;
      box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.08);
    }

    .cc-dial {
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }

    .cc-chevron {
      width: 12px;
      height: 12px;
      color: #6b7280;
      flex-shrink: 0;
      transition: transform 0.18s ease, color 0.15s ease;
    }

    .cc-trigger--open .cc-chevron {
      color: #116AEF;
      transform: rotate(180deg);
    }

    .cc-trigger.is-invalid.cc-trigger--open .cc-chevron {
      color: #dc3545;
    }

    .cc-panel {
      width: 100%;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06);
      padding: 6px;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      direction: ltr;
      text-align: left;
      animation: ccPanelIn 0.14s ease-out;
    }

    @keyframes ccPanelIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .cc-search-header {
      padding: 2px 2px 6px 2px;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 4px;
      flex-shrink: 0;
    }

    .cc-search-wrap {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .cc-search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
    }

    .cc-search-input {
      width: 100%;
      height: 34px;
      padding: 6px 28px 6px 32px;
      border: 1.5px solid #d1d5db;
      border-radius: 6px;
      font-size: 13px;
      color: #1e293b;
      background-color: #ffffff;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .cc-search-input:focus {
      border-color: #116AEF;
      box-shadow: 0 0 0 2px rgba(17, 106, 239, 0.14);
    }

    .cc-search-input::placeholder {
      color: #94a3b8;
    }

    .cc-search-clear {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .cc-search-clear:hover {
      background: #cbd5e1;
    }

    .cc-list {
      max-height: 230px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 transparent;
    }

    .cc-list::-webkit-scrollbar {
      width: 5px;
    }

    .cc-list::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    .cc-option {
      width: 100%;
      border: none;
      background: transparent;
      border-radius: 6px;
      padding: 8px 10px;
      display: flex;
      align-items: center;
      gap: 9px;
      text-align: left;
      font-size: 13.5px;
      color: #374151;
      cursor: pointer;
      transition: background-color 0.12s ease, color 0.12s ease;
    }

    .cc-option:hover,
    .cc-option--highlighted {
      background-color: #f4f8ff;
      color: #0f172a;
    }

    .cc-option--selected {
      background-color: #eff6ff;
      color: #116AEF;
      font-weight: 600;
    }

    .cc-option--selected:hover,
    .cc-option--selected.cc-option--highlighted {
      background-color: #e6f0ff;
      color: #116AEF;
    }

    .cc-option__name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .cc-option__code {
      color: #64748b;
      font-size: 12.5px;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    .cc-option--selected .cc-option__code {
      color: #116AEF;
    }

    .cc-option__check {
      flex-shrink: 0;
    }

    .cc-empty {
      padding: 14px 10px;
      text-align: center;
      font-size: 13px;
      color: #94a3b8;
    }
  `],
  template: `
    <button
      #triggerBtn
      type="button"
      class="cc-trigger"
      [class.cc-trigger--open]="isOpen"
      [class.is-invalid]="invalid"
      [disabled]="disabled"
      [attr.aria-expanded]="isOpen"
      aria-haspopup="listbox"
      aria-label="Select country calling code"
      (click)="toggle()"
      (keydown)="onTriggerKeyDown($event)">
      <span class="cc-trigger__value">
        <img
          *ngIf="selectedCountry.flagUrl"
          class="cc-flag"
          [src]="selectedCountry.flagUrl"
          [alt]="selectedCountry.iso.toUpperCase()"
          loading="lazy" />
        <span class="cc-dial">{{ selectedCountry.code }}</span>
      </span>
      <svg
        class="cc-chevron"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    <ng-template #panelTpl>
      <div class="cc-panel" role="listbox" aria-label="Country calling codes">
        <div class="cc-search-header">
          <div class="cc-search-wrap">
            <svg
              class="cc-search-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              #searchInput
              type="text"
              class="cc-search-input"
              placeholder="Search country or code..."
              [value]="searchQuery"
              (input)="onSearchInput($event)"
              (click)="$event.stopPropagation()"
              (keydown)="onSearchKeyDown($event)"
              autocomplete="off"
              spellcheck="false" />
            <button
              *ngIf="searchQuery"
              type="button"
              class="cc-search-clear"
              (click)="clearSearch($event)"
              tabindex="-1"
              aria-label="Clear search">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748b"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div class="cc-list" #listContainer>
          <ng-container *ngIf="filteredCountries.length > 0; else emptyTpl">
            <button
              *ngFor="let country of filteredCountries; let i = index; trackBy: trackByIso"
              type="button"
              class="cc-option"
              role="option"
              [attr.aria-selected]="country.iso === selectedCountry.iso"
              [class.cc-option--selected]="country.iso === selectedCountry.iso"
              [class.cc-option--highlighted]="i === highlightedIndex"
              (mouseenter)="highlightedIndex = i"
              (click)="selectCountry(country)">
              <img
                class="cc-flag"
                [src]="country.flagUrl"
                [alt]="country.iso.toUpperCase()"
                loading="lazy" />
              <span class="cc-option__name">{{ country.name }}</span>
              <span class="cc-option__code">{{ country.code }}</span>
              <svg
                *ngIf="country.iso === selectedCountry.iso"
                class="cc-option__check"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#116AEF"
                stroke-width="2.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
          </ng-container>
          <ng-template #emptyTpl>
            <div class="cc-empty">No matching countries found</div>
          </ng-template>
        </div>
      </div>
    </ng-template>
  `
})
export class CountryCodeSelectComponent implements ControlValueAccessor, OnDestroy {
  @ViewChild('triggerBtn') triggerBtn?: ElementRef<HTMLButtonElement>;
  @ViewChild('panelTpl') panelTpl?: TemplateRef<unknown>;
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('listContainer') listContainer?: ElementRef<HTMLElement>;

  @Input() countries: readonly PhoneCountryOption[] = PHONE_COUNTRIES;
  @Input() disabled: boolean = false;
  @Input() invalid: boolean = false;
  @Input() panelMinWidth: number = 280;

  @Input()
  set value(iso: string) {
    this.currentIso = getPhoneCountryByIso(iso).iso;
    this.cdr.markForCheck();
  }
  get value(): string {
    return this.currentIso;
  }

  @Output() valueChange = new EventEmitter<string>();

  currentIso: string = DEFAULT_PHONE_COUNTRY_ISO;
  isOpen: boolean = false;
  searchQuery: string = '';
  filteredCountries: PhoneCountryOption[] = [...PHONE_COUNTRIES];
  highlightedIndex: number = 0;

  private overlayRef?: OverlayRef;
  private overlaySubs = new Subscription();
  private isBrowser: boolean;
  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private overlay: Overlay,
    private vcr: ViewContainerRef,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  get selectedCountry(): PhoneCountryOption {
    return getPhoneCountryByIso(this.currentIso);
  }

  trackByIso(_index: number, item: PhoneCountryOption): string {
    return item.iso;
  }

  writeValue(val: string | null | undefined): void {
    this.currentIso = getPhoneCountryByIso(val || DEFAULT_PHONE_COUNTRY_ISO).iso;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled && this.isOpen) {
      this.close(false);
    }
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.close(false);
  }

  toggle(): void {
    if (this.disabled) return;
    if (this.isOpen) {
      this.close(true);
    } else {
      this.open();
    }
  }

  onTriggerKeyDown(event: KeyboardEvent): void {
    if (this.disabled) return;
    if (!this.isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.open();
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close(false);
    }
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.applyFilter();
  }

  clearSearch(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.searchQuery = '';
    this.applyFilter();
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
      this.searchInput.nativeElement.focus();
    }
  }

  onSearchKeyDown(event: KeyboardEvent): void {
    event.stopPropagation();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveHighlight(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveHighlight(-1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredCountries.length) {
          this.selectCountry(this.filteredCountries[this.highlightedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.close(false);
        this.triggerBtn?.nativeElement.focus();
        break;
      case 'Tab':
        this.close(true);
        break;
    }
  }

  selectCountry(country: PhoneCountryOption): void {
    if (this.disabled) return;
    this.currentIso = country.iso;
    this.onChange(country.iso);
    this.onTouched();
    this.valueChange.emit(country.iso);
    this.close(false);
    this.triggerBtn?.nativeElement.focus();
    this.cdr.markForCheck();
  }

  private open(): void {
    if (!this.isBrowser || !this.triggerBtn || !this.panelTpl || this.overlayRef) return;

    this.searchQuery = '';
    this.applyFilter();

    const triggerEl = this.triggerBtn.nativeElement;
    const triggerWidth = Math.round(triggerEl.getBoundingClientRect().width);
    const minWidth = Math.max(triggerWidth, this.panelMinWidth);
    const maxWidth = Math.min(340, window.innerWidth - 24);

    const positions: ConnectedPosition[] = [
      { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
      { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
      { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
      { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 }
    ];

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(triggerEl)
      .withPositions(positions)
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: false,
      minWidth,
      maxWidth,
      panelClass: ['app-select-overlay-pane', 'app-country-select-overlay-pane']
    });

    const portal = new TemplatePortal(this.panelTpl, this.vcr);
    this.overlayRef.attach(portal);
    this.isOpen = true;
    this.cdr.markForCheck();

    this.overlaySubs = new Subscription();
    this.overlaySubs.add(
      this.overlayRef.outsidePointerEvents().subscribe((event) => {
        const target = event.target as Node | null;
        if (target && this.triggerBtn?.nativeElement.contains(target)) {
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
          this.triggerBtn?.nativeElement.focus();
        }
      })
    );

    setTimeout(() => {
      this.searchInput?.nativeElement?.focus();
      this.scrollSelectedIntoView();
    }, 0);
  }

  private close(emitTouched: boolean): void {
    this.overlaySubs.unsubscribe();
    this.overlaySubs = new Subscription();

    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
    }

    if (this.isOpen) {
      this.isOpen = false;
      if (emitTouched) {
        this.onTouched();
      }
      this.cdr.markForCheck();
    }
  }

  private applyFilter(): void {
    const q = this.searchQuery.trim().toLowerCase();
    const digitsOnly = q.replace(/^\+/, '');
    if (!q) {
      this.filteredCountries = [...this.countries];
    } else {
      this.filteredCountries = this.countries.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (digitsOnly && c.code.slice(1).includes(digitsOnly)) ||
          c.iso.toLowerCase() === q
      );
    }

    const activeIdx = this.filteredCountries.findIndex((c) => c.iso === this.currentIso);
    this.highlightedIndex = activeIdx >= 0 ? activeIdx : this.filteredCountries.length > 0 ? 0 : -1;
    this.cdr.markForCheck();
  }

  private moveHighlight(step: 1 | -1): void {
    const len = this.filteredCountries.length;
    if (!len) return;
    this.highlightedIndex =
      this.highlightedIndex < 0 ? (step > 0 ? 0 : len - 1) : (this.highlightedIndex + step + len) % len;
    this.cdr.markForCheck();
    this.scrollHighlightedIntoView();
  }

  private scrollSelectedIntoView(): void {
    const container = this.listContainer?.nativeElement;
    if (!container) return;
    const selectedEl = container.querySelector('.cc-option--selected') as HTMLElement | null;
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }

  private scrollHighlightedIntoView(): void {
    const container = this.listContainer?.nativeElement;
    if (!container) return;
    const el = container.querySelector('.cc-option--highlighted') as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }
}
