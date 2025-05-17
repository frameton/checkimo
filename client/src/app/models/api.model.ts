export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;   // ex. 'USER_NOT_FOUND'
    message: string;// phrase lisible
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

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
