import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  CanLoad,
  Route,
  UrlSegment,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/role.model';


@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate, CanActivateChild, CanLoad {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  private checkRole(
    roles: Role[] | undefined,
    redirectUrl: string
  ): Observable<boolean | UrlTree> {
    return this.authService.me$.pipe(
      take(1),
      map(user => {
        if (!user) {
          // Not logged in
          return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: redirectUrl } });
        }
        const userRole: Role = user.role;
        if (roles && roles.length > 0 && !roles.includes(userRole)) {
          // Role not authorized
          return this.router.createUrlTree(['/']);
        }
        return true;
      })
    );
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    const roles = route.data['roles'] as Role[];
    return this.checkRole(roles, state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    const roles = childRoute.data['roles'] as Role[];
    return this.checkRole(roles, state.url);
  }

  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean | UrlTree> {
    const roles = route.data && (route.data['roles'] as Role[]);
    const url = '/' + segments.map(s => s.path).join('/');
    return this.checkRole(roles, url);
  }
}
