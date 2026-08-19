import { HttpHeaders, HttpRequest } from '@angular/common/http';

export const PROCUREMENT_WEB_CLIENT_HEADER = 'X-Procurement-Client';
export const PROCUREMENT_WEB_CLIENT_VALUE = 'web';
export const PROCUREMENT_CSRF_HEADER = 'X-Requested-With';
export const PROCUREMENT_CSRF_HEADER_VALUE = 'XMLHttpRequest';

export function procurementWebLoginHeaders(): HttpHeaders {
  return new HttpHeaders({ [PROCUREMENT_WEB_CLIENT_HEADER]: PROCUREMENT_WEB_CLIENT_VALUE });
}

export function attachProcurementCsrfHeaders<T>(req: HttpRequest<T>): HttpRequest<T> {
  return req.clone({
    setHeaders: {
      [PROCUREMENT_WEB_CLIENT_HEADER]: PROCUREMENT_WEB_CLIENT_VALUE,
      [PROCUREMENT_CSRF_HEADER]: PROCUREMENT_CSRF_HEADER_VALUE,
    },
  });
}
