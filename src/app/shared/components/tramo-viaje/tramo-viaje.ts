import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Viaje } from '../../../core/models/viaje.model';
import { Camion } from '../../../core/models/camion.model';
import { Acoplado } from '../../../core/models/acoplado.model';
import { labelEstadoViaje } from '../../../core/utils/estado-labels';
import { litros100 } from '../../../core/utils/combustible';

@Component({
  selector: 'app-tramo-viaje',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './tramo-viaje.html',
  styleUrl: './tramo-viaje.css',
})
export class TramoViaje {
  viaje = input.required<Viaje>();
  esVuelta = input(false);
  readonly = input(false);
  camionesPorId = input<Record<string, Camion>>({});
  acopladosPorId = input<Record<string, Acoplado>>({});

  iniciar = output<Viaje>();
  cancelar = output<Viaje>();
  finalizar = output<Viaje>();
  finalizarSinVuelta = output<Viaje>();
  reanudar = output<Viaje>();

  labelEstado = labelEstadoViaje;
  litros100 = litros100;

  patenteCamion(camionId: string | null): string {
    if (!camionId) return '';
    return (
      this.camionesPorId()[camionId]?.patente ?? this.acopladosPorId()[camionId]?.patente ?? ''
    );
  }

  calcularDias(inicio: string, fin: string | null): number | null {
    if (!inicio || !fin) return null;
    const d1 = new Date(inicio);
    const d2 = new Date(fin);
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : null;
  }
}
