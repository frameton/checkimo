import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { TokenStorageService } from './token-storage.service';
import { environment } from '@/environments/environments';
import { ApiResponse } from '../models/api.model';

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
  ) {
    const decoded = this.tokenStorage.decoded;
    if (decoded && this.tokenStorage.token && !this.tokenStorage.isExpired(this.tokenStorage.token)) {
      this.meSubject.next(decoded);
    }
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
    return this.http
      .post<ApiResponse<AuthPayload>>(
        `${this.endpoint}/login`,
        dto,
        { withCredentials: true },
      )
      .pipe(
        map(res => this.unwrap(res)),
        tap(({ accessToken }) => {
          this.tokenStorage.token = accessToken;
          this.meSubject.next(this.tokenStorage.decoded);
        }),
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

  /** Appel à POST /auth/refresh */
  refresh(): Observable<void> {
    return this.http
      .post<ApiResponse<AuthPayload>>(
        `${this.endpoint}/refresh`,
        {},
        { withCredentials: true },
      )
      .pipe(
        map(res => this.unwrap(res)),
        tap(({ accessToken }) => {
          this.tokenStorage.token = accessToken;
          this.meSubject.next(this.tokenStorage.decoded);
        }),
        map(() => void 0),
      );
  }

  /** Récupère le token JWT stocké */
  get token(): string | null {
    return this.tokenStorage.token;
  }
}