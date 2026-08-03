import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-flota-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './flota-item.html',
  styleUrl: './flota-item.css'
})
export class FlotaItem {
  item = input.required<{ id: string }>();
  nombre = input<string>('');
  estado = input<string>('');
  labelEstado = input<(estado: string) => string>(estado => estado);
  empresa = input<string>('');
  motivo = input<string | null>(null);
  readonly = input(false);

  disponible = output<any>();
  noDisponible = output<any>();
}
