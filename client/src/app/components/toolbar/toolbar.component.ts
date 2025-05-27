import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints, LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
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
})
export class ToolbarComponent {
  @Output() menuToggle = new EventEmitter<void>();

  isMobile = false;
  isLoggedIn = false; // à remplacer par votre service d'auth
  user: User | null = null; // à remplacer par votre service d'utilisateur

  constructor(
    private router: Router,
    private breakpoint: BreakpointObserver,
    private authService: AuthService
  ) {
    this.breakpoint.observe([Breakpoints.Handset]).subscribe(b => {
      this.isMobile = b.matches;
    });

    this.authService.isLoggedIn$().subscribe(log => {
      this.isLoggedIn = log;
    });

    this.authService.me$.subscribe(u => {
      this.user = u;
      console.log('Utilisateur connecté :', this.user);
      
    });
  }

  onLogin() {
    // implémenter la logique de connexion
    this.isLoggedIn = true;
    this.router.navigate(['/login']);
  }

  onLogout() {
    // implémenter la logique de déconnexion
    this.isLoggedIn = false;
    this.router.navigate(['/']);
  }
}