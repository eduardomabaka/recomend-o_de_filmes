import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.page.html',
  styleUrl: './reset-password.page.scss',
})
export class ResetPasswordPage implements OnInit {
  token = '';
  password = '';
  confirmPassword = '';
  error = signal('');
  success = signal('');
  loading = signal(false);

  constructor(
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';
    if (!this.token) {
      this.error.set('Link inválido ou incompleto. Peça um novo email de recuperação.');
    }
  }

  submit(): void {
    this.error.set('');
    this.success.set('');

    if (!this.token) {
      this.error.set('Token em falta.');
      return;
    }

    if (!this.password || this.password.length < 6) {
      this.error.set('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('As palavras-passe não coincidem.');
      return;
    }

    this.loading.set(true);
    this.auth.resetPassword({ token: this.token, password: this.password }).subscribe((res) => {
      this.loading.set(false);
      if (res.error) {
        this.error.set(res.error);
        return;
      }
      this.success.set(res.message ?? 'Palavra-passe atualizada.');
      setTimeout(() => {
        this.router.navigateByUrl('/login');
      }, 2000);
    });
  }
}
