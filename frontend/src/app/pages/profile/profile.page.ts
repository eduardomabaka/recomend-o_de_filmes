import { Component, HostListener, OnInit, signal } from '@angular/core';
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
  loading = signal(false);

  editingOverlay = signal(false);
  saveBanner = signal('');

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

  protected openEditOverlay(): void {
    this.error.set('');
    this.saveBanner.set('');
    this.editingOverlay.set(true);
    document.body.style.overflow = 'hidden';
  }

  protected cancelEdit(): void {
    const user = this.auth.user();
    if (user) {
      this.name = user.name;
      this.email = user.email;
    }
    this.password = '';
    this.confirmPassword = '';
    this.editingOverlay.set(false);
    this.error.set('');
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.editingOverlay()) {
      this.cancelEdit();
    }
  }

  submit(): void {
    this.error.set('');

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
        this.saveBanner.set('Perfil atualizado com sucesso.');
        document.body.style.overflow = '';
        this.editingOverlay.set(false);
      });
  }
}
