import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Output
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
  template: `
    <div class="app-select-menu" role="listbox" [attr.dir]="dir">
      <ng-container *ngIf="items.length > 0; else emptyTpl">
        <ng-container *ngFor="let item of items; let i = index">
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
            <i
              *ngIf="item.selected && !item.disabled"
              class="ft ft-check app-select-item__check"
              aria-hidden="true"></i>
          </button>
        </ng-container>
      </ng-container>
      <ng-template #emptyTpl>
        <div class="app-select-empty">No options available</div>
      </ng-template>
    </div>
  `
})
export class CustomSelectPanelComponent implements AfterViewInit {
  @Output() optionSelected = new EventEmitter<CustomSelectOptionItem>();

  items: CustomSelectOptionItem[] = [];
  highlightedIndex = -1;
  dir: 'ltr' | 'rtl' = 'ltr';

  constructor(
    private el: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.scrollActiveIntoView();
  }

  setItems(items: CustomSelectOptionItem[], dir: 'ltr' | 'rtl' = 'ltr'): void {
    this.items = items;
    this.dir = dir;
    const activeIdx = items.findIndex((item) => item.selected && !item.disabled);
    this.highlightedIndex = activeIdx >= 0 ? activeIdx : items.findIndex((item) => !item.disabled);
    this.cdr.markForCheck();
    setTimeout(() => this.scrollActiveIntoView(), 0);
  }

  moveHighlight(step: 1 | -1): void {
    if (!this.items.length) return;
    const len = this.items.length;
    let next = this.highlightedIndex;
    for (let count = 0; count < len; count++) {
      next = (next + step + len) % len;
      if (!this.items[next].disabled) {
        this.highlightedIndex = next;
        this.cdr.markForCheck();
        this.scrollHighlightedIntoView();
        return;
      }
    }
  }

  highlightByChar(char: string): void {
    const lower = char.toLowerCase();
    const len = this.items.length;
    if (!len) return;
    const start = this.highlightedIndex >= 0 ? this.highlightedIndex + 1 : 0;
    for (let offset = 0; offset < len; offset++) {
      const idx = (start + offset) % len;
      const item = this.items[idx];
      if (!item.disabled && item.label.toLowerCase().startsWith(lower)) {
        this.highlightedIndex = idx;
        this.cdr.markForCheck();
        this.scrollHighlightedIntoView();
        return;
      }
    }
  }

  selectHighlighted(): boolean {
    if (this.highlightedIndex < 0 || this.highlightedIndex >= this.items.length) {
      return false;
    }
    const item = this.items[this.highlightedIndex];
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

  private scrollActiveIntoView(): void {
    const activeEl = this.el.nativeElement.querySelector('.app-select-item.active') as HTMLElement | null;
    activeEl?.scrollIntoView({ block: 'nearest' });
  }

  private scrollHighlightedIntoView(): void {
    const highlightedEl = this.el.nativeElement.querySelector('.app-select-item.highlighted') as HTMLElement | null;
    highlightedEl?.scrollIntoView({ block: 'nearest' });
  }
}
