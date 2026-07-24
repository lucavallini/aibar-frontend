import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  @Output() toggleSidebar = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    public themeService: ThemeService
  ) {}

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onToggleTema(): void {
    this.themeService.alternar();
  }

  cerrarSesion(): void {
    this.authService.logout();
  }
}