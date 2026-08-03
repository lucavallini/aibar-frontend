import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  toggleSidebar = output<void>();

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

  recargar(): void {
    window.location.reload();
  }

  cerrarSesion(): void {
    this.authService.logout();
  }
}