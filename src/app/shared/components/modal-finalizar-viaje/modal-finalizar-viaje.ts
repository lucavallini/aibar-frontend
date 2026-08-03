import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-modal-finalizar-viaje',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DecimalPipe, Modal],
  templateUrl: './modal-finalizar-viaje.html',
  styleUrl: './modal-finalizar-viaje.css'
})
export class ModalFinalizarViaje {
  error = input<string | null>(null);
  soloIdaInicial = input(false);

  cerrar = output<void>();
  confirmar = output<{ fecha_fin: string; kms_recorridos: number; kms_descargado?: number; litros_combustible?: number; solo_ida: boolean }>();

  kmsRecorridos: number | null = null;
  kmsDescargado: number | null = null;
  litrosCombustible: number | null = null;
  fechaFinInput = signal('');
  soloIda = signal(false);

  constructor() {
    const ahora = new Date();
    const y = ahora.getFullYear();
    const m = String(ahora.getMonth() + 1).padStart(2, '0');
    const d = String(ahora.getDate()).padStart(2, '0');
    const h = String(ahora.getHours()).padStart(2, '0');
    const min = String(ahora.getMinutes()).padStart(2, '0');
    this.fechaFinInput.set(`${y}-${m}-${d}T${h}:${min}`);
    this.soloIda.set(this.soloIdaInicial());
  }

  onConfirmar(): void {
    if (this.kmsRecorridos === null || this.kmsRecorridos < 0) return;
    if (this.kmsRecorridos === 0 && (!this.kmsDescargado || this.kmsDescargado <= 0)) return;

    this.confirmar.emit({
      fecha_fin: new Date(this.fechaFinInput()).toISOString(),
      kms_recorridos: this.kmsRecorridos,
      kms_descargado: this.kmsDescargado ?? undefined,
      litros_combustible: this.litrosCombustible ?? undefined,
      solo_ida: this.soloIda(),
    });
  }
}
