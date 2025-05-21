import { AuthService } from '@/app/services/auth.service';
import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-toolbar',
  imports: [
    RouterOutlet,
    CommonModule,
    MatToolbarModule,
    MatIconModule,
  ],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent {
  @Output() menuToggle = new EventEmitter<void>();

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  logout(): void {
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}