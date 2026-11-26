import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  forwardRef
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator
} from '@angular/forms';
import {
  DEFAULT_PHONE_COUNTRY_ISO,
  PHONE_COUNTRIES,
  PhoneCountryOption,
  formatPhoneNumber,
  getPhoneCountryByIso,
  getPhoneNationalPlaceholder,
  isValidPhoneForCountry,
  splitPhoneNumber
} from '../../utils/phone-countries';
import { CountryCodeSelectComponent } from '../country-code-select/country-code-select.component';

@Component({
  selector: 'app-phone-number-input',
  standalone: true,
  imports: [CommonModule, CountryCodeSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneNumberInputComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PhoneNumberInputComponent),
      multi: true
    }
  ],
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .phone-input-group {
      display: flex;
      align-items: stretch;
      gap: 6px;
      width: 100%;
      direction: ltr;
      text-align: left;
    }

    .phone-country-select {
      width: 98px;
      flex-shrink: 0;
    }

    .phone-national-input {
      flex: 1 1 0%;
      min-width: 0;
      width: 100%;
      height: 42px;
      border-radius: 8px;
      border: 1.5px solid #D7D7D7;
      padding: 8px 12px;
      font-size: 14px;
      color: #2B2F33;
      background-color: #ffffff;
      direction: ltr;
      text-align: left;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
    }

    .phone-national-input:hover:not(:disabled):not(.is-invalid):not(:focus) {
      border-color: #9ca3af;
    }

    .phone-national-input:focus:not(:disabled) {
      outline: none;
      border-color: #116AEF;
      background-color: #fcfdff;
      box-shadow: 0 0 0 3px rgba(17, 106, 239, 0.12);
    }

    .phone-national-input::placeholder {
      color: #A8A9AC;
      font-size: 13.5px;
      opacity: 1;
    }

    .phone-national-input:disabled {
      background-color: #f3f4f6;
      border-color: #e5e7eb;
      color: #6b7280;
      cursor: not-allowed;
      opacity: 1;
    }

    .phone-national-input.is-invalid {
      border-color: #dc3545 !important;
      background-image: none !important;
    }

    .phone-national-input.is-invalid:focus {
      border-color: #dc3545 !important;
      box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.15) !important;
    }
  `],
  template: `
    <div class="phone-input-group" dir="ltr">
      <div class="phone-country-select">
        <app-country-code-select
          [countries]="countries"
          [value]="countryIso"
          [disabled]="disabled"
          [invalid]="invalid"
          (valueChange)="onCountryIsoChange($event)">
        </app-country-code-select>
      </div>
      <input
        type="tel"
        inputmode="numeric"
        class="form-control phone-national-input"
        [attr.id]="inputId || null"
        [attr.name]="name || null"
        [value]="phoneNational"
        [placeholder]="phonePlaceholder"
        [disabled]="disabled"
        [attr.maxlength]="maxLength"
        autocomplete="tel-national"
        (input)="onPhoneInput($event)"
        (blur)="onPhoneBlur()"
        [class.is-invalid]="invalid"
      />
    </div>
  `
})
export class PhoneNumberInputComponent implements ControlValueAccessor, Validator {
  @Input() countries: readonly PhoneCountryOption[] = PHONE_COUNTRIES;
  @Input() defaultCountryIso: string = DEFAULT_PHONE_COUNTRY_ISO;
  @Input() invalid: boolean = false;
  @Input() disabled: boolean = false;
  @Input() preferFixedLine: boolean = false;
  @Input() inputId: string = '';
  @Input() name: string = '';
  @Input() maxLength: number = 20;

  countryIso: string = DEFAULT_PHONE_COUNTRY_ISO;
  phoneNational: string = '';

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  constructor(private cdr: ChangeDetectorRef) {}

  get phonePlaceholder(): string {
    return getPhoneNationalPlaceholder(this.countryIso, this.preferFixedLine);
  }

  writeValue(val: unknown): void {
    const raw = this.extractPhoneString(val);
    if (!raw) {
      this.countryIso = getPhoneCountryByIso(this.defaultCountryIso).iso;
      this.phoneNational = '';
    } else {
      const parsed = splitPhoneNumber(raw, this.defaultCountryIso);
      this.countryIso = parsed.countryIso;
      this.phoneNational = parsed.national;
    }
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const rawVal = this.extractPhoneString(control?.value);
    if (!rawVal) {
      return null;
    }

    const digits = (this.phoneNational || '').replace(/\D/g, '');
    if (digits) {
      return isValidPhoneForCountry(digits, this.countryIso)
        ? null
        : { invalidPhoneNumber: true };
    }

    const parsed = splitPhoneNumber(rawVal, this.countryIso || this.defaultCountryIso);
    if (!parsed.national) {
      return { invalidPhoneNumber: true };
    }

    return isValidPhoneForCountry(parsed.national, parsed.countryIso)
      ? null
      : { invalidPhoneNumber: true };
  }

  onCountryIsoChange(iso: string): void {
    if (this.disabled) return;
    this.countryIso = getPhoneCountryByIso(iso || this.defaultCountryIso).iso;
    if (this.phoneNational) {
      this.onChange(formatPhoneNumber(this.countryIso, this.phoneNational));
      this.onValidatorChange();
    }
    this.cdr.markForCheck();
  }

  onPhoneInput(event: Event): void {
    if (this.disabled) return;
    const input = event.target as HTMLInputElement;
    const raw = input.value || '';
    const trimmed = raw.trim();

    if (trimmed.startsWith('+') || trimmed.startsWith('00')) {
      const parsed = splitPhoneNumber(trimmed, this.countryIso);
      this.countryIso = parsed.countryIso;
      this.phoneNational = parsed.national;
      input.value = parsed.national;
    } else {
      const digits = raw.replace(/\D/g, '');
      input.value = digits;
      this.phoneNational = digits;
    }

    const formatted = formatPhoneNumber(this.countryIso, this.phoneNational);
    this.onChange(formatted);
    this.onValidatorChange();
    this.cdr.markForCheck();
  }

  onPhoneBlur(): void {
    if (this.disabled) return;
    this.onTouched();
  }

  private extractPhoneString(val: unknown): string {
    if (!val) return '';
    if (typeof val === 'string') return val.trim();
    if (typeof val === 'object') {
      const obj = val as Record<string, unknown>;
      const candidate =
        obj['e164Number'] ||
        obj['internationalNumber'] ||
        obj['number'] ||
        '';
      return typeof candidate === 'string' ? candidate.trim() : String(candidate || '').trim();
    }
    return String(val).trim();
  }
}
