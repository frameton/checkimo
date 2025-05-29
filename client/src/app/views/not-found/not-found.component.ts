import { Component } from '@angular/core';
import { Location } from '@angular/common'
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  imports: [
    MatIconModule
  ],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NotFoundComponent {
  constructor(private location: Location) { }

  onClickBack(): void {
    this.location.historyGo(-1);
  }
}
