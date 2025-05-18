import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanLoad,
  Route,
  UrlSegment,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanLoad {
  constructor(
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private router: Router
  ) {}

  private handleAuth(stateUrl?: string): Observable<boolean | UrlTree> {
    const token = this.authService.token;
    if (!token) {
      // Pas de token, redirige vers login
      return of(
        this.router.createUrlTree(['/login'], {
          queryParams: { returnUrl: stateUrl }
        })
      );
    }

    // Token présent mais peut être expiré
    if (!this.tokenStorage.isExpired(token)) {
      // Token valide
      return of(true);
    }

    // Token expiré : tenter un refresh
    return this.authService.refresh().pipe(
      map(() => true),
      catchError(() =>
        // Échec du refresh => redirection login
        of(
          this.router.createUrlTree(['/login'], {
            queryParams: { returnUrl: stateUrl }
          })
        )
      )
    );
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.handleAuth(state.url);
  }

  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean | UrlTree> {
    const url = '/' + segments.map(s => s.path).join('/');
    return this.handleAuth(url);
  }
}
