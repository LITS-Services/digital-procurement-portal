import { Injectable } from "@angular/core";
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "environments/environment";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private apiBase = environment.apiUrl?.replace(/\/+$/, "");
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    
    const isApi = this.apiBase && req.url.startsWith(this.apiBase);

    const token = localStorage.getItem("token"); // where you saved it after login

    let authReq = req;

    if (isApi && token) {
      authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
    return next.handle(authReq);
  }
}
