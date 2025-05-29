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
    if (this.isAuthEndpoint(req.url)) {
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

  private isAuthEndpoint(url: string): boolean {
    // Ajustez le regexp si nécessaire selon votre routing.
    return /\/auth\/(login|refresh)$/.test(url);
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

  private logoutAndRedirect(err: unknown): Observable<never> {
    this.auth.logout().subscribe();      // nettoyage + cookie clear
    this.router.navigate(['/login']);    // redirection immédiate
    return throwError(() => err);
  }
}