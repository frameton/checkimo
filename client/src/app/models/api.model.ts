// models/api-response.ts
// ─────────────────────────────────────────────────────────────
// Modèle de réponse d'API générique et complet pour Checkimo.
// Inspiré des bonnes pratiques JSON:API, il gère :
//   • succès et erreurs sous une union discriminée (`success: true|false`),
//   • pagination (meta + liens),
//   • horodatage de la réponse,
//   • helpers de type‐guard & de mapping côté front.
// ─────────────────────────────────────────────────────────────

/** Horodatage ISO (ex. "2025-05-16T14:38:00Z") */
export type IsoDate = string;

/** Métadonnées de pagination renvoyées par l'API. */
export interface PaginationMeta {
  total: number;      // nombre total d'éléments
  page: number;       // page courante (1‐based)
  perPage: number;    // éléments par page
  lastPage: number;   // page max (calculé côté serveur)
}

/** Liens HATEOAS de pagination. */
export interface PaginationLinks {
  self: string;
  first: string;
  prev?: string;
  next?: string;
  last: string;
}

/** Structure d'une erreur normalisée. */
export interface ApiErrorBody {
  code: string;              // ex. "USER_NOT_FOUND"
  message: string;           // courte description pour l'UI
  details?: unknown;         // champs additionnels (stack, validation…)
}

/** Réponse de succès contenant un payload typé. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  links?: PaginationLinks;
  timestamp: IsoDate;
}

/** Réponse d'erreur (aucun payload `data`). */
export interface ApiError {
  success: false;
  error: ApiErrorBody;
  timestamp: IsoDate;
}

/** Union principale exposée dans les services HTTP. */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ──────────────────────────── Helpers ──────────────────────────

/** Type‑guard utilitaire : permet `if (isApiError(resp))` */
export function isApiError<T>(resp: ApiResponse<T>): resp is ApiError {
  return resp.success === false;
}

/**
 * Mappe le `data` d'une réponse de succès en conservant le reste.
 * Si la réponse est une erreur, elle est renvoyée inchangée.
 */
export function mapApiData<T, U>(
  resp: ApiResponse<T>,
  mapper: (input: T) => U
): ApiResponse<U> {
  if (resp.success) {
    return {
      ...resp,
      data: mapper(resp.data),
    } as ApiSuccess<U>;
  }
  return resp as ApiError;
}
