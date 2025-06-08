import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../services/user.service';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '@/environments/environments';
import { AuthService } from '@/app/services/auth.service';

@Component({
  selector: 'app-login-register',
  standalone: true,
  templateUrl: './login-register.component.html',
  styleUrls: ['./login-register.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class LoginRegisterComponent {
  isLoading: boolean = false;
  loginForm: FormGroup;
  registerForm: FormGroup;
  forgotPasswordForm: FormGroup;
  registerError: string | null = null;
  loginError: string | null = null;
  resendEmailError: string | null = null;
  resendEmailSuccess: string | null = null;
  registerSuccess: string | null = null;
  hidePassword: boolean = true;
  hidePasswordConfirm: boolean = true;
  forgotPasswordError: string | null = null;
  forgotPasswordSuccess: string | null = null;
  emailSent: boolean = false;
  appName: string = environment.appName;
  saveEmailSent: string | null = null;
  loginBlocked: boolean = false;

  cooldownSeconds = 0;
  private cooldownDuration = 60;

  private lastRegisterTime = 0;
  private registerCooldown = 3000;

  mode: 'login' | 'register' | "forgotPassword" = 'login'; // état du mode (à définir dans la classe)

  constructor(private fb: FormBuilder, private userService: UserService, private router: Router, private route: ActivatedRoute, private auth: AuthService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.registerForm = this.fb.group({
      firstName: ['', [
        Validators.required,
        Validators.maxLength(100),
        Validators.pattern(/^(?!.*[-\s]{2,})[a-zA-ZÀ-ÿ]+([-' ][a-zA-ZÀ-ÿ]+)*$/)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.maxLength(100),
        Validators.pattern(/^(?!.*[-\s]{2,})[a-zA-ZÀ-ÿ]+([-' ][a-zA-ZÀ-ÿ]+)*$/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(254),
        Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      ]],
      emailConfirm: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(254),
        Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(72),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,72}$/)
      ]],
      passwordConfirm: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(72),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,72}$/)
      ]]
    }, { validators: [this.emailMatchValidator, this.passwordMatchValidator] });
  }

  ngOnInit() {
    this.registerForm.get('password')?.valueChanges.subscribe(() => {
      this.registerForm.updateValueAndValidity();
    });
    this.registerForm.get('passwordConfirm')?.valueChanges.subscribe(() => {
      this.registerForm.updateValueAndValidity();
    });
  }

  // Validator: email confirmation match
  emailMatchValidator(form: FormGroup) {
    const email = form.get('email')?.value;
    const emailConfirm = form.get('emailConfirm')?.value;
    return email && emailConfirm && email === emailConfirm ? null : { emailMismatch: true };
  }

  // Validator: password confirmation match
  passwordMatchValidator(form: FormGroup) {
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

  redirectLogin() {
    // Redirection vers la page d'accueil ou une autre page
    this.switchMode('login');
  }

  resendEmail() {
    if (this.cooldownSeconds > 0) {
      this.resendEmailSuccess = null;
      this.resendEmailError = `Veuillez patienter ${this.cooldownSeconds} secondes avant une nouvelle demande.`;
      return;
    }
    this.isLoading = true;
    let obj = {
      email: this.saveEmailSent
    }
    this.userService.resendEmailConfirm(obj).subscribe({
      next: (data: any) => {
        this.resendEmailError = null;
        this.resendEmailSuccess = "Si un compte existe, un email de confirmation a été renvoyé.";
        this.isLoading = false;
        this.startCooldown();
      },
      error: (err: any) => {
        console.log(err);
        
        this.resendEmailSuccess = null;
        this.resendEmailError = "Une erreur est survenue, veuillez réessayer ultérieurement.";
        this.isLoading = false;
      }
    });
  }

  startCooldown() {
    this.cooldownSeconds = this.cooldownDuration;
    const interval = setInterval(() => {
      this.cooldownSeconds--;
      if (this.cooldownSeconds <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  }

  switchMode(mode: string) {
    this.mode = mode as 'login' | 'register' | "forgotPassword";
    this.registerError = null;
    this.registerSuccess = null;
    this.saveEmailSent = null;
    this.forgotPasswordError = null;
    this.forgotPasswordSuccess = null;
    this.emailSent = false;
    this.loginForm.reset();
    this.registerForm.reset();
  }

  onRegister() {
    const now = Date.now();
    if (now - this.lastRegisterTime < this.registerCooldown) {
      this.registerError = "Veuillez patienter avant de réessayer.";
      return;
    }
    this.lastRegisterTime = now;

    if (this.registerForm.invalid) {
      this.registerError = "Veuillez remplir correctement le formulaire.";
      return;
    }
    this.isLoading = true;
    let obj = {
      firstName: this.registerForm.get('firstName')?.value.trim(),
      lastName: this.registerForm.get('lastName')?.value.trim(),
      email: this.registerForm.get('email')?.value.trim(),
      password: this.registerForm.get('password')?.value
    }

    this.userService.create(obj).subscribe({
      next: (data) => {
        console.log("Inscription réussie");
        
        // this.registerSuccess = "Inscription réussie ! Vous pouvez maintenant vous connecter.";
        this.emailSent = true;
        this.registerError = null;
        this.registerForm.reset();
        this.isLoading = false;
        this.saveEmailSent = obj.email;
        this.startCooldown();
      },
      error: err => {
        console.log(err);
        
        this.emailSent = false;
        this.registerError = "Erreur lors de l'inscription.";
        this.registerSuccess = null;
        this.isLoading = false;
      }
    });
  }

  onForgotPassword() {
    this.isLoading = true;
    if (this.forgotPasswordForm.invalid) {
      this.loginError = "Veuillez entrer un email valide.";
      this.isLoading = false;
      return;
    }
    let obj = {
      email: this.forgotPasswordForm.get('email')?.value.trim()
    }
    this.userService.forgotPassword(obj).subscribe({
      next: (data: any) => {
        this.forgotPasswordError = null;
        this.forgotPasswordSuccess = "Un email de réinitialisation a été envoyé si l'email est associé à un compte.";
        this.isLoading = false;
      },
      error: (err: any) => {
        this.forgotPasswordSuccess = null;
        this.forgotPasswordError = "Une erreur est survenue, veuillez réessayer ultérieurement.";
        this.isLoading = false;
      }
    });
  }

  onLogin() {
    this.loginError = null;
    if (this.loginForm.invalid) {
      // this.loginError = "Veuillez remplir tous les champs correctement.";
      return;
    }
    this.isLoading = true;
    let obj = {
      email: this.loginForm.get('email')?.value.trim(),
      password: this.loginForm.get('password')?.value
    }
    this.auth.login(obj).subscribe({
    next: (data: any) => {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
      this.router.navigateByUrl(returnUrl);
      this.isLoading = false;
      this.loginError = null; // Réinitialise l'erreur en cas de succès
    },
    error: (err: any) => {
      // Message neutre, jamais de précision sur email/mdp
      if (err.status === 429) {
        this.loginError = "Trop de tentatives. Merci de patienter quelques instants.";
        this.blockLoginTemporarily(); // voir ci-dessous
      } else {
        this.loginError = err?.error?.message || "Email ou mot de passe invalide.";
      }
      this.isLoading = false;
    }
  });
}

  blockLoginTemporarily() {
    this.loginBlocked = true;
    let cooldown = 60; // secondes
    const interval = setInterval(() => {
      cooldown--;
      if (cooldown <= 0) {
        this.loginBlocked = false;
        clearInterval(interval);
      }
    }, 1000);
  }

  get passwordStrength() {
    const password = this.registerForm.get('password')?.value || '';
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])(.{8,})$/.test(password);
  }
}
