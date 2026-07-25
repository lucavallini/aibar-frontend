import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface ItemMenu {
  label: string;
  ruta: string;
  soloAdmin: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  @Input() abierta = false;

  itemsMenu: ItemMenu[] = [
    { label: 'Viajes', ruta: '/viajes', soloAdmin: false },
    { label: 'Choferes', ruta: '/choferes', soloAdmin: false },
    { label: 'Camiones', ruta: '/camiones', soloAdmin: false },
    { label: 'Multas', ruta: '/multas', soloAdmin: false },
    { label: 'Auditoría', ruta: '/auditoria', soloAdmin: true },
    { label: 'Usuarios', ruta: '/usuarios', soloAdmin: true },
  ];

  constructor(private authService: AuthService) {}

  get itemsVisibles(): ItemMenu[] {
    const esAdmin = this.authService.getRol() === 'administrador';
    return this.itemsMenu.filter(item => !item.soloAdmin || esAdmin);
  }
}