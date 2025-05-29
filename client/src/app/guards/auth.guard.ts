import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanLoad,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Route,
  UrlSegment,
  UrlTree,
  Router,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AuthService } from '@/app/services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanLoad {
  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  /** Génère l’UrlTree de redirection vers /login. */
  private redirectToLogin(returnUrl?: string): UrlTree {
    return this.router.createUrlTree(
      ['/login'],
      { queryParams: { returnUrl } },
    );
  }

  /** Logique commune à canActivate / canLoad. */
  private ensureAuthenticated(stateUrl?: string): Observable<boolean | UrlTree> {
    // 1) Token présent ET non expiré → accès immédiat
    if (this.auth.isLoggedInSync()) return of(true);

    // 2) Sinon, on tente un refresh silencieux
    return this.auth.refresh().pipe(
      map(() => true),                                   // refresh OK → accès
      catchError(() => of(this.redirectToLogin(stateUrl))) // refresh KO → login
    );
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.ensureAuthenticated(state.url);
  }

  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean | UrlTree> {
    const url = '/' + segments.map(s => s.path).join('/');
      return this.ensureAuthenticated(url);
    }
  }