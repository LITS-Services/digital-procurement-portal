import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { attachBearerToken, isAuthExcludedUrl, isAuthLogoutUrl, withCookieAuthRequest } from './auth-http.utils';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const skip = isAuthExcludedUrl(req.url);

    const source$ = skip ? of<string | null>(null) : this.auth.ensureValidAccessToken$();

    return source$.pipe(
      switchMap((maybeToken) => {
        const authReq = skip
          ? withCookieAuthRequest(req, this.auth.useCookieAuth())
          : (this.auth.useCookieAuth()
              ? withCookieAuthRequest(req, true)
              : attachBearerToken(req, maybeToken));

        return next.handle(authReq).pipe(
          catchError((err) => {
            const isRefresh = req.url.includes('/Auth/Procurement-Refresh');
            const isLogout = isAuthLogoutUrl(req.url);
            if (!skip && err instanceof HttpErrorResponse && err.status === 401) {
              if (isLogout || this.auth.isLoggingOut || !this.auth.isAuthenticated()) {
                return throwError(() => err);
              }
              return this.auth.refreshAccessToken$().pipe(
                switchMap((newToken) => {
                  if (!this.auth.isAuthenticated() && !newToken) {
                    this.auth.performLogout('session-expired');
                    return throwError(() => err);
                  }
                  const retryReq = this.auth.useCookieAuth()
                    ? withCookieAuthRequest(req, true)
                    : attachBearerToken(req, newToken);
                  return next.handle(retryReq);
                }),
                catchError((refreshErr) => {
                  if (this.auth.isAuthenticated() && !this.auth.isLoggingOut) {
                    this.auth.performLogout('session-expired');
                  }
                  return throwError(() => refreshErr);
                })
              );
            }

            if (isRefresh && err instanceof HttpErrorResponse && err.status === 401) {
              if (this.auth.isAuthenticated() && !this.auth.isLoggingOut) {
                sessionStorage.setItem('authFlash', 'Your session has expired. Please sign in again.');
              }
            }

            return throwError(() => err);
          })
        );
      })
    );
  }
}
