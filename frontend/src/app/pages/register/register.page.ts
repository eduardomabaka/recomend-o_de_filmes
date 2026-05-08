import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

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

  submit() {
    // TODO: ligar ao endpoint /api/auth/register (precisa de sessão/cookie)
    alert('Registo: falta ligar ao backend (sessão).');
  }
}

