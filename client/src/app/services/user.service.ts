// services/user.service.ts
// ─────────────────────────────────────────────────────────────
// Version « sans pagination » — l’API renvoie la liste complète ou
// applique sa propre pagination interne, mais le front ne transmet
// plus `page` ni `perPage`.
// ─────────────────────────────────────────────────────────────

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { AuthService } from '../auth/auth.service'; // Adjust the path as needed

import { environment } from '@/environments/environments';
import { ApiResponse, ApiSuccess, isApiError, mapApiData } from '../models/api.model';
import { User, UserProps } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  // ───────────────────────── Helper URL ──────────────────────────

  private url(path: string): string {
    const base    = environment.apiBaseUrl.replace(/\/+$/, '');
    const version = environment.apiVersion.replace(/^\/+/, '/').replace(/\/+$/, '');
    const clean   = path.replace(/^\/+/, '');
    return `${base}${version}/${clean}`;
  }

  private authOpts() {
    const token = this.auth.getToken?.();
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  // ───────────────────────── Unwrap helper ──────────────────────

  private unwrap<T, U>(
    source$: Observable<ApiResponse<T>>,
    mapper: (t: T) => U,
  ): Observable<U> {
    return source$.pipe(
      map((resp) => {
        if (isApiError(resp)) {
          throw new Error(resp.error.message);
        }
        const mapped = mapApiData(resp, mapper) as ApiSuccess<U>;
        return mapped.data;
      }),
    );
  }

  // ──────────────────────────── CRUD publics ──────────────────────────

  /**
   * Récupère la liste des utilisateurs (sans paramètres de pagination).
   */
  getUsers(): Observable<User[]> {
    const req$ = this.http.get<ApiResponse<UserProps[]>>(this.url('users'), this.authOpts());
    return this.unwrap(req$, (arr) => arr.map(User.hydrate));
  }

  /** Récupère un User unique. */
  getUser(id: string): Observable<User> {
    const req$ = this.http.get<ApiResponse<UserProps>>(this.url(`users/${id}`), this.authOpts());
    return this.unwrap(req$, User.hydrate);
  }

  /** Création. */
  createUser(dto: Partial<UserProps>): Observable<User> {
    const req$ = this.http.post<ApiResponse<UserProps>>(this.url('users'), dto, this.authOpts());
    return this.unwrap(req$, User.hydrate);
  }

  /** Mise à jour. */
  updateUser(id: string, dto: Partial<UserProps>): Observable<User> {
    const req$ = this.http.patch<ApiResponse<UserProps>>(this.url(`users/${id}`), dto, this.authOpts());
    return this.unwrap(req$, User.hydrate);
  }

  /** Suppression (retourne true si succès). */
  deleteUser(id: string): Observable<boolean> {
    const req$ = this.http.delete<ApiResponse<null>>(this.url(`users/${id}`), this.authOpts());
    return this.unwrap(req$, () => true);
  }
}
