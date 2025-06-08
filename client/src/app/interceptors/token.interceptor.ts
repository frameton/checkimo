import { Injectable, Injector } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';

import { AuthService } from '@/app/services/auth.service';
import { TokenStorageService } from '@/app/services/token-storage.service';

@Injectable({ providedIn: 'root' })
export class TokenInterceptor implements HttpInterceptor {
  // Flag pour empêcher la boucle de logout
  private isLoggingOut = false;

  constructor(
    private readonly injector: Injector,
    private readonly tokenStorage: TokenStorageService,
    private readonly router: Router,
  ) {}

  private get auth(): AuthService {
    return this.injector.get(AuthService);
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    // Les endpoints d’auth ne doivent pas embarquer le JWT ni déclencher de refresh.
    if (this.isAuthEndpoint(req)) {
      return next.handle(req);
    }

    const token = this.tokenStorage.token;

    // 1. Token présent & valide → on ajoute l’entête et on traite la réponse.
    if (token && !this.tokenStorage.isExpired(token)) {
      const authReq = this.addAuthHeader(req, token);
      return next.handle(authReq).pipe(
        catchError(err => this.handle401(err, authReq, next)),
      );
    }

    // 2. Pas de token ou déjà expiré → on tente un refresh AVANT la requête.
    return this.auth.refresh().pipe(
      switchMap(() => {
        const fresh = this.tokenStorage.token;
        const retryReq = fresh ? this.addAuthHeader(req, fresh) : req;
        return next.handle(retryReq);
      }),
      catchError(err => this.logoutAndRedirect(err)),
    );
  }

  /* ------------------------------------------------------------------ */
  /*                           Helpers privés                           */
  /* ------------------------------------------------------------------ */

  private addAuthHeader(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  private readonly openAuthEndpoints = [
  { method: 'POST', urlEnd: '/api/v1/auth/login' },
  { method: 'POST', urlEnd: '/api/v1/auth/refresh' },
  { method: 'POST', urlEnd: '/api/v1/users' },
  { method: 'POST', urlEnd: '/api/v1/users/resend-confirmation' },
  { method: 'POST', urlEnd: '/api/v1/users/confirm' },
  { method: 'POST', urlEnd: '/api/v1/users/reset-password' },
  { method: 'POST', urlEnd: '/api/v1/users/confirm-reset-password' }
  // Ajoute ici d'autres exceptions si besoin
];

private isAuthEndpoint(req: HttpRequest<any>): boolean {
  return this.openAuthEndpoints.some(
    endpoint => req.method === endpoint.method && req.url.endsWith(endpoint.urlEnd)
  );
}

  /**
   * Gère les 401 : tente un refresh puis rejoue la requête une seule fois.
   */
  private handle401(
    error: unknown,
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return this.auth.refresh().pipe(
        switchMap(() => {
          const fresh = this.tokenStorage.token;
          const retryReq = fresh ? this.addAuthHeader(request, fresh) : request;
          return next.handle(retryReq);
        }),
        catchError(err => this.logoutAndRedirect(err)),
      );
    }
    return throwError(() => error);
  }

  /**
   * Effectue le logout et redirige vers la page de connexion,
   * sans retomber dans une boucle infinie.
   */
  private logoutAndRedirect(error: any): Observable<never> {
    if (!this.isLoggingOut) {
      this.isLoggingOut = true;
      this.tokenStorage.clear();
      this.router.navigate(['/login']);
    }
    // Important : on retourne une erreur pour casser la chaîne RxJS, sans relancer d'autre requête
    return throwError(() => error);
  }
}
