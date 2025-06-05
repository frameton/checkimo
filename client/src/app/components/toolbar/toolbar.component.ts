import { Component, Output, EventEmitter, HostListener, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints, LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { BehaviorSubject, Observable, take } from 'rxjs';

import { User } from '@/app/models/user.model';
import { AuthService } from '@/app/services/auth.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LayoutModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
  @Output() readonly menuToggle = new EventEmitter<void>();

  isMobile = false;

  isLoggedIn$!: Observable<boolean>;
  user$!: Observable<User | null>;

  private readonly userSubject = new BehaviorSubject<User | null>(null);

  constructor(
    private readonly router: Router,
    private readonly breakpoint: BreakpointObserver,
    private readonly auth: AuthService
  ) {
    // Détecte le passage en mode handset / desktop
    this.isLoggedIn$ = this.auth.isLoggedIn$;
    this.user$       = this.auth.me$;
    this.user$.subscribe(user => this.userSubject.next(user));

    this.breakpoint
      .observe([Breakpoints.Handset])
      .subscribe(b => (this.isMobile = b.matches));
  }

  /* ----------------------------------------------------------- */
  /* UX : barre inverse lors du scroll                           */
  /* ----------------------------------------------------------- */
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const element = document.querySelector('.toolbar') as HTMLElement;
    if (!element) return;
    if (window.scrollY > element.clientHeight) {
      element.classList.add('toolbar-inverse');
    } else {
      element.classList.remove('toolbar-inverse');
    }
  }

  // ngAfterViewInit(): void {
  //   // console.log(this.isLoggedIn$.source?.source);
  //   this.user$.subscribe(u => console.log('me$', u));

  //   this.isLoggedIn$.subscribe(u => console.log('log$', u));
    
    
  // }

  get initials(): string {
    const user = this.userSubject.getValue();
    
    if (!user) return '';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';

    return (first + "." + last).toUpperCase();
  }

  /* ----------------------------------------------------------- */
  /* Navigation actions                                          */
  /* ----------------------------------------------------------- */
  redirectLogin(): void {
    this.router.navigate(['/login']);
  }

  redirectLogout(): void {
  this.auth.logout()
    .pipe(take(1)) // <-- pour éviter des subscriptions infinies
    .subscribe({
      next: () => this.router.navigate(['/landing']),
      error: (err) => {
        // Optionnel : afficher une notification ou log l’erreur
        console.error('Erreur lors de la déconnexion', err);
        this.router.navigate(['/landing']); // quand même
      }
    });
  }
}