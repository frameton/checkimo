import { UserService } from '@/app/services/user.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@/environments/environments';

@Component({
  selector: 'app-confirm-account',
  standalone: true,
  templateUrl: './confirm-account.component.html',
  styleUrls: ['./confirm-account.component.scss'],
  imports: [],
})
export class ConfirmAccountComponent implements OnInit {
  status: 'pending' | 'success' | 'error' = 'pending';
  missingToken: boolean = false;
  appName = environment.appName;

  constructor(private route: ActivatedRoute, private userService: UserService, private router: Router) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.status = 'error';
      // this.missingToken = 'Lien de confirmation invalide.';
      this.missingToken = true;
      return;
    }

    // Adapte l’URL API à ton backend !
    let obj = {
      token: token
    }
    this.userService.confirmInscription(obj)
      .subscribe({
        next: (res: any) => {
          this.status = 'success';
          // this.message = 'Votre compte a bien été confirmé !';
        },
        error: (err: any) => {
          console.log(err);
          
          this.status = 'error';
          // this.message = 'Lien de confirmation invalide ou expiré.';
        }
      });
  }

  redirectLogin() {
    // Redirection vers la page de login
    this.router.navigate(['/login']);
  }
}
