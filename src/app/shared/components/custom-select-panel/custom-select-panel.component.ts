import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild
} from '@angular/core';

export interface CustomSelectOptionItem {
  index: number;
  label: string;
  disabled: boolean;
  selected: boolean;
  groupHeader?: string;
}

@Component({
  selector: 'app-custom-select-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
      min-width: 100%;
      box-sizing: border-box;
    }
    .app-select-menu {
      width: 100%;
      min-width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      overflow: visible;
      max-height: none;
    }
    .app-select-search-header {
      padding: 4px 4px 6px 4px;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 4px;
      flex-shrink: 0;
    }
    .dropdown-search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      box-sizing: border-box;
    }
    .dropdown-search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      pointer-events: none;
      z-index: 2;
    }
    .dropdown-search-input {
      width: 100%;
      height: 34px;
      padding: 6px 28px 6px 32px;
      border: 1.5px solid #d1d5db;
      border-radius: 6px;
      font-size: 13.5px;
      color: #1e293b;
      background-color: #ffffff;
      outline: none;
      transition: all 0.15s ease;
      box-sizing: border-box;
    }
    .dropdown-search-input:focus {
      border: 1.5px solid #116AEF;
      box-shadow: 0 0 0 2px rgba(17, 106, 239, 0.15);
      background-color: #ffffff;
    }
    .dropdown-search-input::placeholder {
      color: #94a3b8;
      font-size: 13px;
    }
    .dropdown-search-clear {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      padding: 0;
      border: none;
      background: #e2e8f0;
      border-radius: 50%;
      cursor: pointer;
      color: #64748b;
      transition: background 0.15s ease;
    }
    .dropdown-search-clear:hover {
      background: #cbd5e1;
      color: #1e293b;
    }
    .app-select-items-container {
      width: 100%;
      max-height: 220px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 transparent;
      box-sizing: border-box;
    }
    .app-select-items-container::-webkit-scrollbar {
      width: 5px;
    }
    .app-select-items-container::-webkit-scrollbar-track {
      background: transparent;
    }
    .app-select-items-container::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
    .app-select-item {
      white-space: nowrap;
    }
    .app-select-item__label {
      white-space: nowrap;
    }
  `],
  template: `
    <div class="app-select-menu" role="listbox" [attr.dir]="dir">
      <div class="app-select-search-header" *ngIf="showSearch">
        <div class="dropdown-search-wrapper">
          <svg
            class="dropdown-search-icon"
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
            class="dropdown-search-input"
            [placeholder]="searchPlaceholder"
            [value]="searchQuery"
            (input)="onSearchInput($event)"
            (click)="$event.stopPropagation()"
            (keydown)="onSearchKeyDown($event)"
            autocomplete="off"
            spellcheck="false" />
          <button
            *ngIf="searchQuery"
            type="button"
            class="dropdown-search-clear"
            (click)="clearSearch($event)"
            tabindex="-1"
            aria-label="Clear search">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="app-select-items-container" #itemsContainer>
        <ng-container *ngIf="filteredItems.length > 0; else emptyTpl">
          <ng-container *ngFor="let item of filteredItems; let i = index">
            <div *ngIf="item.groupHeader" class="app-select-group-label">
              {{ item.groupHeader }}
            </div>
            <button
              type="button"
              class="app-select-item"
              role="option"
              [attr.aria-selected]="item.selected && !item.disabled"
              [class.active]="item.selected && !item.disabled"
              [class.highlighted]="i === highlightedIndex"
              [disabled]="item.disabled"
              (mouseenter)="onMouseEnter(i, item)"
              (click)="onSelect(item)">
              <span class="app-select-item__label">{{ item.label }}</span>
              <svg
                *ngIf="item.selected && !item.disabled"
                class="app-select-item__check"
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
        </ng-container>
        <ng-template #emptyTpl>
          <div class="app-select-empty">
            {{ searchQuery ? 'No matching options found' : 'No options available' }}
          </div>
        </ng-template>
      </div>
    </div>
  `
})
export class CustomSelectPanelComponent implements AfterViewInit {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('itemsContainer') itemsContainer?: ElementRef<HTMLElement>;

  @Output() optionSelected = new EventEmitter<CustomSelectOptionItem>();
  @Output() closeRequested = new EventEmitter<void>();

  allItems: CustomSelectOptionItem[] = [];
  filteredItems: CustomSelectOptionItem[] = [];
  highlightedIndex = -1;
  dir: 'ltr' | 'rtl' = 'ltr';
  searchQuery = '';
  searchPlaceholder = 'Search...';
  showSearch = true;

  constructor(
    private el: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.showSearch && this.searchInput) {
        this.searchInput.nativeElement.focus();
      } else {
        this.scrollActiveIntoView();
      }
    }, 0);
  }

  setItems(items: CustomSelectOptionItem[], dir: 'ltr' | 'rtl' = 'ltr', placeholder: string = 'Search...'): void {
    this.allItems = items;
    this.dir = dir;
    this.searchPlaceholder = placeholder;
    this.showSearch = items.length > 0;
    this.applyFilter();
    setTimeout(() => {
      if (this.showSearch && this.searchInput) {
        this.searchInput.nativeElement.focus();
      } else {
        this.scrollActiveIntoView();
      }
    }, 0);
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
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
        this.selectHighlighted();
        break;
      case 'Escape':
        event.preventDefault();
        this.closeRequested.emit();
        break;
      case 'Tab':
        this.closeRequested.emit();
        break;
    }
  }

  moveHighlight(step: 1 | -1): void {
    if (!this.filteredItems.length) return;
    const len = this.filteredItems.length;
    let next = this.highlightedIndex;
    for (let count = 0; count < len; count++) {
      next = (next + step + len) % len;
      if (!this.filteredItems[next].disabled) {
        this.highlightedIndex = next;
        this.cdr.markForCheck();
        this.scrollHighlightedIntoView();
        return;
      }
    }
  }

  highlightByChar(char: string): void {
    const lower = char.toLowerCase();
    const len = this.filteredItems.length;
    if (!len) return;
    const start = this.highlightedIndex >= 0 ? this.highlightedIndex + 1 : 0;
    for (let offset = 0; offset < len; offset++) {
      const idx = (start + offset) % len;
      const item = this.filteredItems[idx];
      if (!item.disabled && item.label.toLowerCase().startsWith(lower)) {
        this.highlightedIndex = idx;
        this.cdr.markForCheck();
        this.scrollHighlightedIntoView();
        return;
      }
    }
  }

  selectHighlighted(): boolean {
    if (this.highlightedIndex < 0 || this.highlightedIndex >= this.filteredItems.length) {
      return false;
    }
    const item = this.filteredItems[this.highlightedIndex];
    if (item.disabled) return false;
    this.onSelect(item);
    return true;
  }

  onMouseEnter(index: number, item: CustomSelectOptionItem): void {
    if (!item.disabled) {
      this.highlightedIndex = index;
    }
  }

  onSelect(item: CustomSelectOptionItem): void {
    if (item.disabled) return;
    this.optionSelected.emit(item);
  }

  private applyFilter(): void {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredItems = [...this.allItems];
    } else {
      this.filteredItems = this.allItems.filter((item) =>
        item.label.toLowerCase().includes(query)
      );
    }
    const activeIdx = this.filteredItems.findIndex((item) => item.selected && !item.disabled);
    this.highlightedIndex = activeIdx >= 0 ? activeIdx : this.filteredItems.findIndex((item) => !item.disabled);
    this.cdr.markForCheck();
  }

  private scrollActiveIntoView(): void {
    const container = this.itemsContainer?.nativeElement;
    if (!container) return;
    const activeEl = container.querySelector('.app-select-item.active') as HTMLElement | null;
    activeEl?.scrollIntoView({ block: 'nearest' });
  }

  private scrollHighlightedIntoView(): void {
    const container = this.itemsContainer?.nativeElement;
    if (!container) return;
    const highlightedEl = container.querySelector('.app-select-item.highlighted') as HTMLElement | null;
    highlightedEl?.scrollIntoView({ block: 'nearest' });
  }
}
