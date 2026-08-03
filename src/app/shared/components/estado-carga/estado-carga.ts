import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-estado-carga',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './estado-carga.html',
  styleUrl: './estado-carga.css'
})
export class EstadoCarga {
  cargando = input(false);
  error = input<string | null>(null);
  mostrarError = input(true);
}
