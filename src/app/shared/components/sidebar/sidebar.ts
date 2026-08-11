import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface ItemMenu {
  label: string;
  ruta: string;
  soloAdmin: boolean;
  icono: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  abierta = input(false);

  itemsMenu: ItemMenu[] = [
    { label: 'Viajes', ruta: '/viajes', soloAdmin: false, icono: 'viajes' },
    { label: 'Choferes', ruta: '/choferes', soloAdmin: false, icono: 'choferes' },
    { label: 'Camiones', ruta: '/camiones', soloAdmin: false, icono: 'camiones' },
    { label: 'Acoplados', ruta: '/acoplados', soloAdmin: false, icono: 'acoplados' },
    { label: 'Multas', ruta: '/multas', soloAdmin: false, icono: 'multas' },
    { label: 'Combustible', ruta: '/combustible', soloAdmin: false, icono: 'combustible' },
    { label: 'Auditoría', ruta: '/auditoria', soloAdmin: true, icono: 'auditoria' },
    { label: 'Usuarios', ruta: '/usuarios', soloAdmin: true, icono: 'usuarios' },
  ];

  constructor(private authService: AuthService) {}

  get itemsVisibles(): ItemMenu[] {
    const esAdmin = this.authService.esAdmin();
    return this.itemsMenu.filter(item => !item.soloAdmin || esAdmin);
  }
}