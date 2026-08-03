import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-modal-cancelar-viaje',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Modal],
  templateUrl: './modal-cancelar-viaje.html',
})
export class ModalCancelarViaje {
  error = input<string | null>(null);

  cerrar = output<void>();
  confirmar = output<string>();

  motivoCancelacion = '';

  onConfirmar(): void {
    if (this.motivoCancelacion.trim().length < 5) return;
    this.confirmar.emit(this.motivoCancelacion);
    this.motivoCancelacion = '';
  }
}
