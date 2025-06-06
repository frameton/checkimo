import { Component } from '@angular/core';
import { environment } from '@/environments/environments';

@Component({
  selector: 'app-landing',
  imports: [],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  appName = environment.appName;
}
