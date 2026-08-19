import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { attachProcurementCsrfHeaders } from './procurement-client.headers';
import { isAuthExcludedUrl } from './auth-http.utils';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.auth.useCookieAuth()
      || !MUTATING_METHODS.has(req.method.toUpperCase())
      || isAuthExcludedUrl(req.url)) {
      return next.handle(req);
    }
    return next.handle(attachProcurementCsrfHeaders(req));
  }
}
