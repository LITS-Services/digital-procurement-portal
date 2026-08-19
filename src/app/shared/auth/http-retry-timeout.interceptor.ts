import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, TimeoutError, throwError, timer } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';

const DEFAULT_HTTP_TIMEOUT_MS = 30_000;
const DEFAULT_HTTP_RETRY_COUNT = 2;
const DEFAULT_HTTP_RETRY_BASE_DELAY_MS = 1_000;

@Injectable()
export class HttpRetryTimeoutInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const httpTimeoutMs = window.config?.httpTimeoutMs ?? DEFAULT_HTTP_TIMEOUT_MS;
    const httpRetryCount = window.config?.httpRetryCount ?? DEFAULT_HTTP_RETRY_COUNT;
    const httpRetryBaseDelayMs = window.config?.httpRetryBaseDelayMs ?? DEFAULT_HTTP_RETRY_BASE_DELAY_MS;
    const skipRetry = this.shouldSkipRetry(req);

    return next.handle(req).pipe(
      timeout(httpTimeoutMs),
      retry({
        count: skipRetry ? 0 : httpRetryCount,
        delay: (error, retryIndex) => {
          if (!this.isRetryableError(error)) {
            return throwError(() => error);
          }
          const delayMs = httpRetryBaseDelayMs * 2 ** (retryIndex - 1);
          return timer(delayMs);
        },
      }),
      catchError(error => {
        if (error instanceof TimeoutError) {
          return throwError(() => new HttpErrorResponse({
            error: { message: 'The request timed out. Please try again.' },
            status: 408,
            statusText: 'Request Timeout',
            url: req.url,
          }));
        }
        return throwError(() => error);
      }),
    );
  }

  private shouldSkipRetry(req: HttpRequest<unknown>): boolean {
    const url = (req.url || '').toLowerCase();
    return url.includes('/auth/') || /^(post|put|patch|delete)$/i.test(req.method);
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof TimeoutError) return true;
    if (!(error instanceof HttpErrorResponse)) return true;
    if (error.status === 0) return true;
    if (error.status === 408) return true;
    if (error.status >= 500 && error.status < 600) return true;
    return false;
  }
}
