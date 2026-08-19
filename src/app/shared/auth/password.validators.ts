import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').toString();
  if (!value) return null;

  const errors: ValidationErrors = {};
  if (value.length < PASSWORD_MIN_LENGTH) {
    errors['minlength'] = { requiredLength: PASSWORD_MIN_LENGTH, actualLength: value.length };
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    errors['maxlength'] = { requiredLength: PASSWORD_MAX_LENGTH, actualLength: value.length };
  }
  if (!/[a-z]/.test(value)) errors['passwordLowercase'] = true;
  if (!/[A-Z]/.test(value)) errors['passwordUppercase'] = true;
  if (!/[0-9]/.test(value)) errors['passwordDigit'] = true;
  if (!/[^a-zA-Z0-9]/.test(value)) errors['passwordSpecial'] = true;

  return Object.keys(errors).length ? errors : null;
}

export const newPasswordValidators = [Validators.required, passwordStrengthValidator];

export function confirmPasswordMatchValidator(
  passwordControlName = 'password',
  confirmControlName = 'confirmPassword',
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pass = group.get(passwordControlName)?.value;
    const confirm = group.get(confirmControlName)?.value;
    return pass === confirm ? null : { mismatch: true };
  };
}
