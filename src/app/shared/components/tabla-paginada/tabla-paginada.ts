import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Paginacion } from '../paginacion/paginacion';

@Component({
  selector: 'app-tabla-paginada',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Paginacion],
  templateUrl: './tabla-paginada.html',
  styleUrl: './tabla-paginada.css',
})
export class TablaPaginada {
  headers = input.required<string[]>();
  items = input.required<any[]>();
  cargando = input(false);
  error = input<string | null>(null);
  pagina = input(1);
  totalPaginas = input(1);
  total = input(0);
  emptyMessage = input('No hay registros todavía.');

  cambioPagina = output<number>();
}
