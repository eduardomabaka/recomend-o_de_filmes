import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss'
})
export class RegisterPage {
  name = '';
  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  submit(): void {
    this.error.set('');

    if (!this.name.trim() || !this.email.trim() || !this.password) {
      this.error.set('Preencha todos os campos.');
      return;
    }

    this.loading.set(true);
    this.auth
      .register({ name: this.name.trim(), email: this.email.trim(), password: this.password })
      .subscribe((res) => {
        this.loading.set(false);

        if (res.error || !res.user) {
          this.error.set(res.error ?? 'Não foi possível criar a conta.');
          return;
        }

        this.router.navigateByUrl('/popular');
      });
  }
}
