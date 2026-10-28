import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LanguageService } from './language.service';
import { LANGUAGE_STORAGE_KEY } from './language.types';

function resolveCurrentLang(langService?: LanguageService | null): string {
  let lang: string | null = null;
  try {
    if (langService) {
      lang = langService.current();
    }
  } catch {
    /* fallback to storage */
  }

  if (!lang) {
    try {
      lang = localStorage.getItem(LANGUAGE_STORAGE_KEY) || localStorage.getItem('language');
    } catch {
      lang = typeof document !== 'undefined' ? document.documentElement.lang : 'en';
    }
  }

  return lang === 'ar' ? 'ar' : 'en';
}

/**
 * Class-based HttpInterceptor for AppModule HTTP_INTERCEPTORS multi-provider.
 * Attaches Accept-Language and x-language headers to every outgoing HTTP request.
 */
@Injectable()
export class LanguageInterceptor implements HttpInterceptor {
  constructor(private languageService: LanguageService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const currentLang = resolveCurrentLang(this.languageService);
    const acceptLanguage = currentLang === 'ar' ? 'ar,en;q=0.8' : 'en,ar;q=0.8';

    const cloned = req.clone({
      setHeaders: {
        'Accept-Language': acceptLanguage,
        'x-language': currentLang,
      },
    });

    return next.handle(cloned);
  }
}

/**
 * Functional HttpInterceptorFn variant if needed.
 */
export const languageInterceptorFn: HttpInterceptorFn = (req, next) => {
  let langService: LanguageService | null = null;
  try {
    langService = inject(LanguageService);
  } catch {
    /* ignore */
  }

  const currentLang = resolveCurrentLang(langService);
  const acceptLanguage = currentLang === 'ar' ? 'ar,en;q=0.8' : 'en,ar;q=0.8';

  return next(
    req.clone({
      setHeaders: {
        'Accept-Language': acceptLanguage,
        'x-language': currentLang,
      },
    })
  );
};
