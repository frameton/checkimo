import { Component } from '@angular/core';
import { environment } from '@/environments/environments';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  year = new Date().getFullYear();
  appName = environment.appName;
}
