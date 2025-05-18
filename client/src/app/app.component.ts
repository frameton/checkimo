import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export default class AppComponent {
  constructor(public auth: AuthService) {}

  logout() {
    this.auth.logout().subscribe();
  }
}
