import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private storageKey = 'aibar_theme';

  esOscuro = signal<boolean>(this.leerPreferenciaGuardada());

  constructor() {
    effect(() => {
      document.body.classList.toggle('tema-oscuro', this.esOscuro());
      localStorage.setItem(this.storageKey, this.esOscuro() ? 'oscuro' : 'claro');
    });
  }

  alternar(): void {
    this.esOscuro.set(!this.esOscuro());
  }

  private leerPreferenciaGuardada(): boolean {
    return localStorage.getItem(this.storageKey) === 'oscuro';
  }
}