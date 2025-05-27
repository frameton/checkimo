import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, switchMap, tap } from 'rxjs';
import { TokenStorageService } from './token-storage.service';
import { environment } from '@/environments/environments';
import { ApiResponse } from '../models/api.model';
import { isPlatformBrowser } from '@angular/common';
import { User, UserProps } from '../models/user.model';

/** Données renvoyées par /auth/login et /auth/refresh */
export interface AuthPayload {
  accessToken: string;
}

/** DTO pour le login */
export interface LoginDto {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private meSubject = new BehaviorSubject<any | null>(null);
  readonly me$ = this.meSubject.asObservable();

  private readonly endpoint = `${environment.apiBaseUrl}${environment.apiVersion}/auth`;

  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    const decoded = this.tokenStorage.decoded;
    if (decoded && this.tokenStorage.token && !this.tokenStorage.isExpired(this.tokenStorage.token)) {
      this.meSubject.next(decoded);
    }
  }


  getMe(): Observable<User> {
  return this.http
    .get<ApiResponse<User>>(
      `${environment.apiBaseUrl}${environment.apiVersion}/users/me`,
      { withCredentials: true }
    )
    .pipe(
      map(res => this.unwrap(res)),          // extrait res.data ou lève une erreur
      tap(user => this.meSubject.next(user)) // met à jour votre me$
    );
}


  public isLoggedIn(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    let token = this.tokenStorage.token;
    if (!token) {
      return false;
    }
    return true;
  }

  /** Observable qui émet `true`/`false` selon l’état de connexion */
  public isLoggedIn$(): Observable<boolean> {
    return this.me$.pipe(
      map(user => !!user)
    );
  }

  // Exemple de fonction privée pour décoder le token JWT
  private decodeUserFromToken(token: string): User {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
  id: payload.sub,
  email: payload.email,
  firstName: payload.firstName,
  lastName: payload.lastName,
  role: payload.role,
  createdAt: payload.createdAt,
  updatedAt: payload.updatedAt,
  toJSON: function (): UserProps {
    throw new Error('Function not implemented.');
  },
  fullName: '',
  initiales: ''
};
  }

  /**
   * Extract data or throw error selon l'enveloppe ApiResponse
   */
  private unwrap<T>(res: ApiResponse<T>): T {
    if (!res.success) {
      throw new Error(res.error.message);
    }
    return res.data;
  }

  /** Appel à POST /auth/login */
  login(dto: LoginDto): Observable<void> {
  return this.http.post<ApiResponse<AuthPayload>>(
      `${this.endpoint}/login`,
      dto,
      { withCredentials: true }
    ).pipe(
      map(res => this.unwrap(res)),
      tap(({ accessToken }) => this.tokenStorage.token = accessToken),
      // d’abord émettre le mini-user pour les cas où on a besoin d’un user non-null
      tap(() => this.meSubject.next(this.tokenStorage.decoded)),
      // puis récupérer l’objet User complet
      switchMap(() => this.getMe()),
      map(() => void 0),
    );
}

/** Appel à POST /auth/refresh */
  refresh(): Observable<void> {
    return this.http.post<ApiResponse<AuthPayload>>(
      `${this.endpoint}/login`,
      dto,
      { withCredentials: true }
    ).pipe(
      map(res => this.unwrap(res)),
      tap(({ accessToken }) => this.tokenStorage.token = accessToken),
      // d’abord émettre le mini-user pour les cas où on a besoin d’un user non-null
      tap(() => this.meSubject.next(this.tokenStorage.decoded)),
      // puis récupérer l’objet User complet
      switchMap(() => this.getMe()),
      map(() => void 0),
    );
  }

  /** Appel à POST /auth/logout */
  logout(): Observable<void> {
    return this.http
      .post<ApiResponse<null>>(
        `${this.endpoint}/logout`,
        {},
        { withCredentials: true },
      )
      .pipe(
        tap(() => {
          this.tokenStorage.clear();
          this.meSubject.next(null);
        }),
        map(() => void 0),
      );
  }

  /** Récupère le token JWT stocké */
  get token(): string | null {
    return this.tokenStorage.token;
  }
}