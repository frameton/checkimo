import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  catchError,
  defer,
  finalize,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

import { environment } from '@/environments/environments';
import { ApiResponse } from '@/app/models/api.model';
import { TokenStorageService } from '@/app/services/token-storage.service';
import { User } from '@/app/models/user.model';

/**
 * Payload renvoyé par les endpoints /auth/login et /auth/refresh.
 */
export interface AuthPayload {
  accessToken: string;
}

/**
 * DTO utilisé lors de la soumission du formulaire de connexion.
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Service d’authentification complet :
 *   • Stocke et expose l’utilisateur courant (me$)
 *   • Fournit les appels login / refresh / logout
 *   • Gère le refresh concurrent via un mutex (shareReplay)
 *   • Expose un flux booléen isLoggedIn$ et une variante synchrone isLoggedInSync()
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Store interne typé. NE PAS exposer directement. */
  private readonly meSubject = new BehaviorSubject<User | null>(null);

  /** Flux public (read‑only) de l’utilisateur courant. */
  readonly me$ = this.meSubject.asObservable();

  /** Flux booléen dérivé de me$ indiquant l’état de connexion. */
  readonly isLoggedIn$ = this.me$.pipe(map(Boolean));

  private readonly endpoint = `${environment.apiBaseUrl}${environment.apiVersion}/auth`;

  /** Observable singleton servant de mutex lors d’un refresh pour éviter les collisions. */
  private refreshing$?: Observable<void>;

  constructor(
    private readonly http: HttpClient,
    private readonly tokenStorage: TokenStorageService,
    @Inject(PLATFORM_ID) private readonly platformId: Object,
  ) {
    // Lors du bootstrap, on hydrate meSubject si un token valide est déjà présent.
    const cached = this.tokenStorage.decoded;
    if (cached && !this.tokenStorage.isExpired(this.tokenStorage.token!)) {
      // 1. Émet l’utilisateur « light » immédiatement pour ne pas bloquer l’UI
      this.meSubject.next(cached);
      // 2. Puis remplace‑le par le profil complet dès que disponible
      this.loadMe$.subscribe();
    }
  }

  /* ------------------------------------------------------------------ */
  /*                              PUBLIC API                            */
  /* ------------------------------------------------------------------ */

  /**
   * Authentifie l’utilisateur puis charge son profil complet.
   */
  login(dto: LoginDto): Observable<void> {
    return this.http
      .post<ApiResponse<AuthPayload>>(`${this.endpoint}/login`, dto, {
        withCredentials: true,
      })
      .pipe(
        unwrapResponse<AuthPayload>(),
        tap(({ accessToken }) => (this.tokenStorage.token = accessToken)),
        // On émet d’abord le user "light" décodé du JWT afin que l’UI réagisse vite.
        tap(() => this.meSubject.next(this.tokenStorage.decoded)),
        // Puis on remplace par le profil complet dès qu’il est disponible.
        switchMap(() => this.loadMe$),
        map(() => void 0),
      );
  }

  /**
   * Rafraîchit le token d’accès. Appels concurrents agrégés grâce à shareReplay.
   */
  refresh(): Observable<void> {
    if (!this.refreshing$) {
      this.refreshing$ = this.http
        .post<ApiResponse<AuthPayload>>(`${this.endpoint}/refresh`, {}, {
          withCredentials: true,
        })
        .pipe(
          unwrapResponse<AuthPayload>(),
          tap(({ accessToken }) => {
            this.tokenStorage.token = accessToken;
            // 1. Émet la version « light » pour que les guards et l’UI continuent de fonctionner
            this.meSubject.next(this.tokenStorage.decoded);
          }),
          // 2. Remplace par le profil complet
          switchMap(() => this.loadMe$),
          map(() => void 0),
          finalize(() => (this.refreshing$ = undefined)),
          shareReplay({ bufferSize: 1, refCount: true }),
        );
    }
    return this.refreshing$;
  }

  /**
   * Termine la session côté backend et nettoie le storage local.
   */
  logout(): Observable<void> {
  return this.http
    .post<ApiResponse<null>>(`${this.endpoint}/logout`, {}, { withCredentials: true })
    .pipe(
      tap(() => {
        // On tente le nettoyage côté backend
        this.tokenStorage.clear();
        this.meSubject.next(null);
      }),
      map(() => void 0),
      catchError((err) => {
        // En cas d’échec (genre 401), on nettoie aussi côté client !
        this.tokenStorage.clear();
        this.meSubject.next(null);
        return of(void 0);
      })
    );
}

  /**
   * Variante synchrone (à n’utiliser qu’en SSR ou dans les Route Guards).
   */
  isLoggedInSync(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const token = this.tokenStorage.token;
    return !!token && !this.tokenStorage.isExpired(token);
  }

  /* ------------------------------------------------------------------ */
  /*                               PRIVÉ                                */
  /* ------------------------------------------------------------------ */

  /**
   * Charge le profil détaillé de l’utilisateur.
   * Utilise defer() pour repousser l’appel HTTP jusqu’à l’abonnement et cache la réponse.
   */

  private readonly loadMe$ = defer(() =>
    this.http.get<ApiResponse<User>>(`${environment.apiBaseUrl}${environment.apiVersion}/auth/me`, {
      withCredentials: true,
  })
  ).pipe(
    unwrapResponse<User>(),
    tap((user) => this.meSubject.next(user)),

    catchError((err) => {
      console.error('Erreur lors du chargement du profil complet', err);
      this.meSubject.next(null);
      return of(null);
    }),
  );

  /** Accès direct au JWT brut. */
  get token(): string | null {
    return this.tokenStorage.token;
  }
}

/* ===================================================================== */
/*                       Opérateur Rx : unwrapResponse<T>()               */
/* ===================================================================== */

/**
 * Extrait la propriété data d’une ApiResponse et propage l’erreur si success = false.
 */
export function unwrapResponse<T>() {
  return (source: Observable<ApiResponse<T>>): Observable<T> =>
    source.pipe(
      map((res) => {
        if (!res.success) throw new Error(res.error.message);
        return res.data;
      }),
    );
}
