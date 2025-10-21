import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(private auth: AuthService) {}

  private isAuthUrl(url: string): boolean {
    // ignore url for auth
    return (
      url.includes('/Auth/ProcurementLogin') ||
      url.includes('/Auth/Procurement-Refresh') ||
      url.includes('/Auth/VerifyProcurementOtp') ||
      url.includes('/Auth/ResendOtp') ||
      url.includes('/Auth/ProcurementUserRegister') ||
      url.includes('/Auth/sso/login-url') ||
      url.includes('/Auth/sso/callback')
    );
  }

   private attach(req: HttpRequest<any>, token: string | null): HttpRequest<any> {
    if (!token) return req;
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const skip = this.isAuthUrl(req.url);

    const source$ = skip ? of<string | null>(null) : this.auth.ensureValidAccessToken$();

    return source$.pipe(
      switchMap((maybeToken) => {
        const authReq = skip ? req : this.attach(req, maybeToken);

        return next.handle(authReq).pipe(
          catchError((err) => {
            const isRefresh = req.url.includes('/Auth/Procurement-Refresh');
            if (
              !skip &&
              err instanceof HttpErrorResponse &&
              err.status === 401
            ) {

              // Try ONE refresh + retry
              console.warn('[AUTH] 401 Unauthorized — retrying with refreshed token...');
              return this.auth.ensureValidAccessToken$().pipe(
                switchMap((newToken) => {
                  if (!newToken) {
                    this.auth.performLogout();
                    return throwError(() => err);
                  }
                  return next.handle(this.attach(req, newToken));
                }),
                catchError((refreshErr) => {
                  console.error('[AUTH] Refresh failed after retry — logging out.');
                  this.auth.performLogout();
                  return throwError(() => refreshErr);
                })
              );
            }

              if (isRefresh && err instanceof HttpErrorResponse && err.status === 401) {
                const msg = (err?.error?.[0]?.ErrorMessage ?? err?.error?.message ?? '').toString().toLowerCase();
                if (msg.includes('token expired')) {
                  sessionStorage.setItem('authFlash', 'Your session has expired. Please sign in again.');
                }
                this.auth.performLogout();
              }

            return throwError(() => err);
          })
        );
      })
    );
  }
}