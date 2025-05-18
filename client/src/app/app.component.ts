import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';  // <-- CommonModule
import { MatToolbarModule } from '@angular/material/toolbar';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet,
    CommonModule,
    MatToolbarModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export default class AppComponent {
  constructor(public auth: AuthService) {}

  logout() {
    this.auth.logout().subscribe();
  }
}
