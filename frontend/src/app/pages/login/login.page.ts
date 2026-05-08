import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss'
})
export class LoginPage {
  email = '';
  password = '';

  submit() {
    // TODO: ligar ao endpoint /api/auth/login (precisa de sessão/cookie)
    alert('Login: falta ligar ao backend (sessão).');
  }
}

