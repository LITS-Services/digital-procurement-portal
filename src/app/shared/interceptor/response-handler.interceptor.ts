import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse,
  HttpContextToken,
  HttpContext
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { map, tap } from 'rxjs/operators';

// ---- Optional per-request opt out ----
export const SKIP_TOAST = new HttpContextToken<boolean>(() => false);
export function withSkipToast(context?: HttpContext) {
  return (context ?? new HttpContext()).set(SKIP_TOAST, true);
}

// ---- Your API envelope typings ----
export interface responseDTO<T = any> {
  correlationId: string | null;
  errors: string[];
  isSuccess: boolean;
  location: string | null;
  status: number;
  successMessage: string | null;
  validationErrors: string[];
  value: T;
}

@Injectable()
export class responseHandlerInterceptor implements HttpInterceptor {
  constructor(private toastr: ToastrService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const skip = req.context.get(SKIP_TOAST);

    ///for POST, PUT, PATCH METHods
    const isWriteMethod = /^(POST|PUT|PATCH)$/i.test(req.method);

    return next.handle(req).pipe(
    tap({
    next: (event) => {
      if (skip) return;

      if (event instanceof HttpResponse) {
        const contentType = event.headers.get('Content-Type') || '';
        if (!contentType.includes('application/json')) return;

        const body = event.body as responseDTO | undefined;
        if (!body || typeof body !== 'object') return;

        if ('isSuccess' in body && 'errors' in body && 'status' in body) {
          if (body.isSuccess) {
            if(isWriteMethod){
                   const msg = (body.successMessage && body.successMessage.trim().length > 0)
              ? body.successMessage
              : 'Operation completed successfully.';
            this.toastr.success(msg);
            }
       
              } else {
            const msg = this.extractErrorMessage(body);
            this.toastr.error(msg || 'Something went wrong.');
          }
        }
      }
    },
    error: (err: any) => {
      if (skip) return;

      if (err instanceof HttpErrorResponse) {
        const maybeEnvelope = err.error as Partial<responseDTO> | undefined;
        if (maybeEnvelope && typeof maybeEnvelope === 'object' && 'isSuccess' in maybeEnvelope) {
          const msg = this.extractErrorMessage(maybeEnvelope as responseDTO);
          this.toastr.error(msg || `Request failed (${err.status}).`);
        } else {
          const msg = err?.error?.message || err?.message || `Request failed (${err.status}).`;
          this.toastr.error(msg);
        }
      } else {
        this.toastr.error('Unexpected error occurred.');
      }
    }

  }),

  // pass value on successful responses
  map((event: HttpEvent<any>) => {
    if (event instanceof HttpResponse) {
      const contentType = event.headers.get('Content-Type') || '';
      if (!contentType.includes('application/json')) return event;

      const body = event.body as responseDTO | undefined;
      if (body && typeof body === 'object' && 'isSuccess' in body && (body as any).isSuccess && 'value' in body) {
        return event.clone({ body: (body as any).value });
        }
      }
      return event;
      })
     );
  }

  private extractErrorMessage(body: responseDTO): string {
    if (Array.isArray(body.errors) && body.errors.length > 0) {
      return body.errors[0];
    }
    if (Array.isArray(body.validationErrors) && body.validationErrors.length > 0) {
      return body.validationErrors.join('\n');
    }
    return '';
  }
}
