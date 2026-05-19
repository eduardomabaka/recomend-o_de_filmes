import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.scss',
})
export class ForgotPasswordPage {
  email = '';
  error = signal('');
  success = signal('');
  loading = signal(false);

  constructor(private readonly auth: AuthService) {}

  submit(): void {
    this.error.set('');
    this.success.set('');

    if (!this.email.trim()) {
      this.error.set('Indique o email.');
      return;
    }

    this.loading.set(true);
    this.auth.forgotPassword({ email: this.email.trim() }).subscribe((res) => {
      this.loading.set(false);
      if (res.error) {
        console.error('[forgot-password] Falha no pedido:', res.error);
        this.error.set(res.error);
        return;
      }
      console.info('[forgot-password] Pedido concluído.', {
        delivery: res.delivery,
        message: res.message,
      });
      let msg = res.message ?? 'Pedido enviado.';
      if (res.delivery === 'log_file') {
        msg +=
          ' Em modo desenvolvimento o conteúdo foi gravado em backend/storage/mail.log no servidor (não foi usado SMTP).';
      }
      this.success.set(msg);
    });
  }
}
