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
              if (isWriteMethod) {
                const success = body.successMessage?.trim?.();
                if (success) {
                  this.toastr.success(success);
                }
              }
              } else {
            const msg = this.extractErrorMessage(body);
            if(msg){
              this.toastr.error(msg);
            }
            
          }
        }
      }
    },
    error: (err: any) => {
      if (skip || err?.status === 401) return;

      if(err?.error?.[0]?.ErrorMessage.includes('token expired')){
        return;
      }

    if (err instanceof HttpErrorResponse) {
            const maybeEnvelope = err.error as Partial<responseDTO> | undefined;

            // only toast if it *looks like* your envelope
            const looksLikeEnvelope =
              maybeEnvelope && typeof maybeEnvelope === 'object' &&
              ('isSuccess' in maybeEnvelope || 'errors' in maybeEnvelope || 'validationErrors' in maybeEnvelope);

            if (looksLikeEnvelope) {
              const msg = this.extractErrorMessage(maybeEnvelope as responseDTO);
              if (msg) this.toastr.error(msg);
            }

            // else: do nothing → error will still propagate (good for console/network)
          } else {
            // Non-HttpErrorResponse: ignore toast so it still bubbles up
          }
          // Important: RETURN nothing here; tap won't swallow it—the error continues downstream.
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
