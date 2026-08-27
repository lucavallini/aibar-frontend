import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-paginacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './paginacion.html',
  styleUrl: './paginacion.css',
})
export class Paginacion {
  pagina = input(1);
  totalPaginas = input(1);
  total = input(0);
  cambioPagina = output<number>();

  irAPagina(nueva: number): void {
    if (nueva < 1 || nueva > this.totalPaginas() || nueva === this.pagina()) return;
    this.cambioPagina.emit(nueva);
  }
}
