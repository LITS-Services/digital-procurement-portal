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
          if (skip || this.isQuietAuthUrl(req.url)) return;

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
                if (msg) {
                  this.toastr.error(msg);
                }
              }
            }
          }
        },
        error: (err: any) => {
        
          try {
            if (skip || err?.status === 401 || err?.status === 429) return;
            if (this.isQuietAuthUrl(req.url) || this.isQuietAuthUrl(err?.url)) return;
            if (err?.status === 0) return;

            // Safe token-expired check
            const tokenMsg = (err as any)?.error?.[0]?.ErrorMessage as string | undefined;
            if (typeof tokenMsg === 'string' && tokenMsg.toLowerCase().includes('token expired')) {
              return;
            }

            if (err instanceof HttpErrorResponse) {
              let msg: string | null = null;

              const raw = err.error;

              if (raw && typeof raw === 'object') {
                const maybeEnvelope = raw as Partial<responseDTO>;
                const looksLikeEnvelope = 'isSuccess' in maybeEnvelope && 'errors' in maybeEnvelope;

                if (looksLikeEnvelope) {
                  msg = this.extractErrorMessage(maybeEnvelope as responseDTO);
                }
              }

              if (!msg) {
                msg = 'API failed, please check API/DB.';
              }

              this.toastr.error(msg);
            }

          } catch (e) {
            this.toastr.error('API failed, please check API/DB.');
          }
        },
      }),

      // pass value on successful responses
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          const contentType = event.headers.get('Content-Type') || '';
          if (!contentType.includes('application/json')) return event;

          const body = event.body as responseDTO | undefined;
          const isSuccess = !!(body && ((body as any).isSuccess === true || (body as any).IsSuccess === true));
          if (
            body &&
            typeof body === 'object' &&
            isSuccess &&
            ('value' in body || 'Value' in body)
          ) {
            return event.clone({ body: (body as any).value ?? (body as any).Value });
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

  private isQuietAuthUrl(url: string): boolean {
    const u = (url || '').toLowerCase();
    return u.includes('captcha-config')
      || u.includes('/auth/procurement-refresh')
      || u.includes('/auth/vendor-refresh')
      || u.includes('/auth/procurementlogin')
      || u.includes('/auth/vendorlogin');
  }
}
