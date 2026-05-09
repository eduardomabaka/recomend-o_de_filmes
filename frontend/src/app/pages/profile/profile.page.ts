import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss'
})
export class ProfilePage implements OnInit {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = signal('');
  success = signal('');
  loading = signal(false);

  constructor(protected readonly auth: AuthService) {}

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.name = user.name;
      this.email = user.email;
      return;
    }

    this.auth.checkSession().subscribe(() => {
      const refreshedUser = this.auth.user();
      if (refreshedUser) {
        this.name = refreshedUser.name;
        this.email = refreshedUser.email;
      }
    });
  }

  submit(): void {
    this.error.set('');
    this.success.set('');

    if (!this.name.trim() || !this.email.trim()) {
      this.error.set('Preencha o nome e o email.');
      return;
    }

    if (this.password && this.password.length < 6) {
      this.error.set('A nova palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('A confirmação da palavra-passe não coincide.');
      return;
    }

    this.loading.set(true);
    this.auth
      .updateProfile({
        name: this.name.trim(),
        email: this.email.trim(),
        password: this.password || undefined
      })
      .subscribe((res) => {
        this.loading.set(false);

        if (res.error || !res.user) {
          this.error.set(res.error ?? 'Não foi possível atualizar o perfil.');
          return;
        }

        this.password = '';
        this.confirmPassword = '';
        this.success.set('Perfil atualizado com sucesso.');
      });
  }
}
