import { environment } from '@/environments/environments';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  get token(): string | null {
    return localStorage.getItem(environment.TOKEN_NAME);
  }

  set token(value: string | null) {
    if (value) {
      localStorage.setItem(environment.TOKEN_NAME, value);
    } else {
      localStorage.removeItem(environment.TOKEN_NAME);
    }
  }

  clear(): void {
    localStorage.removeItem(environment.TOKEN_NAME);
  }

  isExpired(token: string): boolean {
    try {
      const [, payloadBase64] = token.split('.');
      const payload = JSON.parse(atob(payloadBase64));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  get decoded(): any | null {
    const token = this.token;
    if (!token) return null;
    try {
      const [, payloadBase64] = token.split('.');
      return JSON.parse(atob(payloadBase64));
    } catch {
      return null;
    }
  }
}