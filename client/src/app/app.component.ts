import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';  // <-- CommonModule
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenav } from '@angular/material/sidenav';
import { ToolbarComponent } from './components/toolbar/toolbar.component';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet,
    CommonModule,
    MatToolbarModule,
    ToolbarComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export default class AppComponent {
  constructor(public auth: AuthService) {}

  @ViewChild('sidenav') sidenav!: MatSidenav;

  // appelé depuis le toolbar
  onMenuToggle() {
    this.sidenav.toggle();
  }

  logout() {
    this.auth.logout().subscribe();
  }
}
