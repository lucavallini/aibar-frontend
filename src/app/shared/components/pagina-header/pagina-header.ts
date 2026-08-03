import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagina-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './pagina-header.html',
  styleUrl: './pagina-header.css'
})
export class PaginaHeader {
  titulo = input.required<string>();
  accionLabel = input('');
  mostrarAccion = input(true);
  nuevo = output<void>();
}
