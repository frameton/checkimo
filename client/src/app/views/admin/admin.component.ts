import { Component } from '@angular/core';
import { environment } from '@/environments/environments';

@Component({
  selector: 'app-admin',
  imports: [],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  appName = environment.appName;
}
