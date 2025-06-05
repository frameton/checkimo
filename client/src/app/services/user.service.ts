// services/user.service.ts
// ─────────────────────────────────────────────────────────────
// Version « sans pagination » — l’API renvoie la liste complète ou
// applique sa propre pagination interne, mais le front ne transmet
// plus `page` ni `perPage`.
// ─────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@/environments/environments';
import { ApiResponse, ApiError } from '../models/api.model';
import { User } from '../models/user.model';


@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly endpoint = `${environment.apiBaseUrl}${environment.apiVersion}/users`;

  constructor(private http: HttpClient) {}

  // ----------------------------- Helpers -----------------------------
  private unwrap<T>(res: ApiResponse<T>): T {
    if (!res.success) {
      // Propager l’erreur pour que les composants puissent la catcher
      throw new Error(res.error.message);
    }
    return res.data;
  }

  // ----------------------------- CRUD -----------------------------
  list(): Observable<User[]> {
    return this.http
      .get<ApiResponse<User[]>>(this.endpoint)
      .pipe(map((res) => this.unwrap(res)));
  }

  get(id: string): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${this.endpoint}/${id}`)
      .pipe(map((res) => this.unwrap(res)));
  }

  create(payload: any): Observable<User> {
    return this.http
      .post<ApiResponse<User>>(this.endpoint, payload)
      .pipe(map((res) => this.unwrap(res)));
  }

  update(id: string, payload: Partial<User>): Observable<User> {
    return this.http
      .patch<ApiResponse<User>>(`${this.endpoint}/${id}`, payload)
      .pipe(map((res) => this.unwrap(res)));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.endpoint}/${id}`)
      .pipe(map(() => void 0)); // on ignore le body
  }
}

// ---------------------------------------------------------------------------
// Points clés :
// 1. Toutes les requêtes typées en <ApiResponse<T>>.
// 2. Méthode privée unwrap<T>() qui :
//      • lève une Error si success=false -> gestion centralisée ;
//      • renvoie data sinon.
// 3. Les composants consomment directement User, pas besoin de vérifier success.
// ---------------------------------------------------------------------------
