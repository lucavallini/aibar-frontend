import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../components/header/header';
import { Sidebar } from '../components/sidebar/sidebar';

@Component({
  selector: 'app-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Header, Sidebar],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout {
  sidebarAbierta = signal(false);

  toggleSidebar(): void {
    this.sidebarAbierta.set(!this.sidebarAbierta());
  }
}