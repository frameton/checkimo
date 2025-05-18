import { bootstrapApplication, BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { config } from './app/app.config.server';
import { HTTP_INTERCEPTORS, HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { TokenInterceptor } from './app/interceptors/token.interceptor';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { routes } from './app/app.routes';
import { ApplicationRef, importProvidersFrom } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import AppComponent from './app/app.component';

const bootstrap = (): Promise<ApplicationRef> => bootstrapApplication(AppComponent, {
  providers: [
    // 1) On active HttpClient et on tire les interceptors du DI
    provideHttpClient(withInterceptorsFromDi()),
    // 2) On enregistre notre TokenInterceptor
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },

    importProvidersFrom(
      BrowserModule,
    ),

    provideAnimations(),

    // Activation du Server-Side Rendering
    provideServerRendering(),

    // Routing : lazy-loading + navigation bloquante pour SSR
    provideRouter(
      routes,
      withEnabledBlockingInitialNavigation()
    ),

    // Hydratation client (reconstruction du DOM SSR côté client)
    provideClientHydration(),
    
  ]
})
  .catch(err => {
      console.error('Bootstrap error:', err);
      throw err;             // <-- on re-lance pour que la promesse reste du bon type
    });

export default bootstrap;
