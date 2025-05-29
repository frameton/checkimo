import { environment } from '@/environments/environments';
import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {

  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

 get token(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(environment.TOKEN_NAME);
  }

  set token(value: string | null) {
    if (!this.isBrowser) return;
    if (value) {
      localStorage.setItem(environment.TOKEN_NAME, value);
    } else {
      localStorage.removeItem(environment.TOKEN_NAME);
    }
  }

  clear(): void {
    if (!this.isBrowser) return;
    console.log('TokenStorageService.clear() called');
    
    localStorage.removeItem(environment.TOKEN_NAME);
  }

  isExpired(token: string): boolean {
    if (!this.isBrowser) return true;
    try {
      const [, payloadBase64] = token.split('.');
      const payload = JSON.parse(atob(payloadBase64));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  get decoded(): any | null {
    if (!this.isBrowser) return null;
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