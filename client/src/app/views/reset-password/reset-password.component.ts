import { environment } from '@/environments/environments';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '@/app/services/user.service';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  status: 'pending' | 'success' = 'pending';
  message = '';
  appName = environment.appName;
  form: FormGroup;
  token: string = '';
  isLoading: boolean = false;
  hidePassword: boolean = true;
  hidePasswordConfirm: boolean = true;
  resetPasswordError: string = "";

   constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {
    this.form = this.fb.group({
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(72),
        // pattern à adapter à ta politique de sécurité !
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,72}$/)
      ]],
      passwordConfirm: ['', Validators.required],
    }, { validators: (form) =>
      form.get('password')?.value === form.get('passwordConfirm')?.value ? null : { passwordMismatch: true }
    });
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.redirectLogin();
      return;
    }

  }

  async onSubmit() {
    if (this.form.invalid) return;
    this.status = 'pending';
    this.isLoading = true;
    let obj = {
      token: this.token,
      newPassword: this.form.value.password,
    };
    this.userService.confirmforgotPassword(obj).subscribe({
      next: (data: any) => {

        if (data.success) {
          this.status = 'success';
          this.form.reset();
          this.isLoading = false;
        }
        else {
          this.resetPasswordError = data.message;
          this.isLoading = false;
        }
      },
      error: err => {
        this.isLoading = false;
        this.resetPasswordError = "Une erreur est survenue, veuillez réessayer ultérieurement.";
      }
    });
  }

  asswordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value ?? '';
    const passwordConfirm = form.get('passwordConfirm')?.value ?? '';

    // Si les deux champs sont vides, on ne retourne PAS d'erreur (l'autre validator required gère le cas)
    if (!password && !passwordConfirm) {
      return null;
    }

    // Si les deux champs sont identiques, c'est bon !
    if (password === passwordConfirm) {
      return null;
    }

    // Sinon, erreur
    return { passwordMismatch: true };
  }

  get passwordStrength() {
    const password = this.form.get('password')?.value || '';
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])(.{8,})$/.test(password);
  }

  redirectLogin() {
    this.router.navigate(['/login']);
  }

}
