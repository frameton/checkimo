import { Component } from '@angular/core';
import { environment } from '@/environments/environments';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  appName = environment.appName;
}
