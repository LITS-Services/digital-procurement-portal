import { Injectable } from '@angular/core';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

const DEFAULT_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'xlsx', 'xls', 'doc', 'docx', 'csv'];
const DEFAULT_MAX_MB = 10;

@Injectable({ providedIn: 'root' })
export class FileValidationService {
  validate(file: File, formKey = 'document'): FileValidationResult {
    if (!file) return { valid: false, error: 'File is required.' };

    const maxMb = formKey === 'profileavatar' ? 5 : DEFAULT_MAX_MB;
    if (file.size > maxMb * 1024 * 1024) {
      return { valid: false, error: `File exceeds maximum size of ${maxMb} MB.` };
    }

    const name = file.name || '';
    const parts = name.split('.');
    if (parts.length > 2) {
      return { valid: false, error: 'Double extensions are not allowed.' };
    }

    const ext = (parts.pop() || '').toLowerCase();
    if (!DEFAULT_EXTENSIONS.includes(ext)) {
      return { valid: false, error: 'File type is not allowed.' };
    }

    return { valid: true };
  }
}
