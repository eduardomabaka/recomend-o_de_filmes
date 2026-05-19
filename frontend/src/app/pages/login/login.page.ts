import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss'
})
export class LoginPage implements OnInit {
  email = '';
  password = '';
  error = signal('');
  success = signal('');
  loading = signal(false);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const msg = this.route.snapshot.queryParamMap.get('msg');
    if (msg === 'account-deleted') {
      this.success.set('Conta eliminada com sucesso.');
    }
  }

  submit(): void {
    this.error.set('');

    if (!this.email.trim() || !this.password) {
      this.error.set('Preencha o email e a palavra-passe.');
      return;
    }

    this.loading.set(true);
    this.auth.login({ email: this.email.trim(), password: this.password }).subscribe((res) => {
      this.loading.set(false);

      if (res.error || !res.user) {
        this.error.set(res.error ?? 'Credenciais inválidas.');
        return;
      }

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/profile';
      this.router.navigateByUrl(returnUrl);
    });
  }
}
