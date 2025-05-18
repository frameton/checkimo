import { bootstrapApplication, BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { TokenInterceptor } from './app/interceptors/token.interceptor';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { routes } from './app/app.routes';
import AppComponent from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';

bootstrapApplication(AppComponent, {
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

    // provideAnimations(),

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
  .catch(err => console.error(err));
  
// bootstrapApplication(AppComponent, appConfig)
//   .catch((err) => console.error(err));
