import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  nombreUsuario = '';
  password = '';
  errorMensaje = signal<string | null>(null);
  cargando = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    this.errorMensaje.set(null);
    this.cargando.set(true);

    this.authService.login(this.nombreUsuario, this.password).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/choferes']); // por ahora redirige acá, después vemos el home real
      },
      error: (err) => {
        this.cargando.set(false);
        if (err.status === 401) {
          this.errorMensaje.set('Usuario o contraseña incorrectos');
        } else {
          this.errorMensaje.set('Ocurrió un error, intentá de nuevo');
        }
      }
    });
  }
}