import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-cancelar-viaje',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './modal-cancelar-viaje.html',
  styleUrl: './modal-cancelar-viaje.css'
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
