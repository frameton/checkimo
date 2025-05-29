import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  CanLoad,
  CanMatch,
  Route,
  UrlSegment,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { AuthService } from '@/app/services/auth.service';   // ✅ nouveau chemin
import { Role } from '@/app/models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleGuard
  implements CanActivate, CanActivateChild, CanLoad, CanMatch
{
  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    const roles = route.data?.['roles'] as Role[] | undefined;
    return this.hasRequiredRole(roles, state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    const roles = childRoute.data?.['roles'] as Role[] | undefined;
    return this.hasRequiredRole(roles, state.url);
  }

  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean | UrlTree> {
    const roles = route.data?.['roles'] as Role[] | undefined;
    const url = '/' + segments.map(s => s.path).join('/');
    return this.hasRequiredRole(roles, url);
  }

  canMatch(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean | UrlTree> {
    const roles = route.data?.['roles'] as Role[] | undefined;
    const url = '/' + segments.map(s => s.path).join('/');
    return this.hasRequiredRole(roles, url);
  }

  /* ------------------------------------------------------------------ */
  /*                        Vérification d’accès                        */
  /* ------------------------------------------------------------------ */
  private hasRequiredRole(
    roles: Role[] | undefined,
    redirectUrl: string,
  ): Observable<boolean | UrlTree> {
    /* 1 ── Fast-path : côté browser, un token valide ⇒ pas de requête réseau */
    if (!roles?.length && this.auth.isLoggedInSync()) return of(true);

    /* 2 ── On récupère le profil (stream me$ déjà hydraté par AuthService) */
    return this.auth.me$.pipe(
      take(1), // un seul snapshot suffit
      switchMap((user) => {
        /* 2.a ── Non connecté ⇒ redirection login */
        if (!user)
          return of(
            this.router.createUrlTree(['/login'], {
              queryParams: { returnUrl: redirectUrl },
            }),
          );

        /* 2.b ── Aucun rôle exigé OU rôle OK ⇒ accès */
        if (!roles?.length || roles.includes(user.role as Role)) return of(true);

        /* 2.c ── Rôle KO ⇒ redirection forbidden */
        return of(this.router.createUrlTree(['/forbidden']));
      }),
      );
    }
  }