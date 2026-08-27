import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../components/header/header';
import { Sidebar } from '../components/sidebar/sidebar';

const ANCHO_ESCRITORIO = 768;

@Component({
  selector: 'app-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Header, Sidebar],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  /** En escritorio el menú arranca visible; en pantallas chicas es un cajón cerrado. */
  sidebarAbierta = signal(typeof window !== 'undefined' && window.innerWidth > ANCHO_ESCRITORIO);

  toggleSidebar(): void {
    this.sidebarAbierta.update((visible) => !visible);
  }
}
