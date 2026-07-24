import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'aibar_token';

  // signal reactivo: cualquier componente puede saber al instante si hay sesión
  isLoggedIn = signal<boolean>(this.hayToken());

  constructor(private http: HttpClient, private router: Router) {}

  login(nombreUsuario: string, password: string): Observable<LoginResponse> {
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('username', nombreUsuario);
    body.set('password', password);

    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      tap(respuesta => {
        sessionStorage.setItem(this.tokenKey, respuesta.access_token);
        this.isLoggedIn.set(true);
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem(this.tokenKey);
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  private hayToken(): boolean {
    return !!sessionStorage.getItem(this.tokenKey);
  }

  getPayload(): { sub: string; rol: string } | null {
  const token = this.getToken();
  if (!token) return null;

  try {
    const payloadBase64 = token.split('.')[1];
    return JSON.parse(atob(payloadBase64));
  } catch {
    return null;
  }
};

  getRol(): string | null {
    return this.getPayload()?.rol ?? null;
  }
}
