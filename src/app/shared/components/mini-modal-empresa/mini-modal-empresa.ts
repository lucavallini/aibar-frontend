import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-mini-modal-empresa',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Modal],
  templateUrl: './mini-modal-empresa.html',
})
export class MiniModalEmpresa {
  nombreInput = '';

  empresaCreada = output<string>();
  cancelar = output<void>();

  confirmar(): void {
    const nombre = this.nombreInput.trim();
    if (nombre) {
      this.empresaCreada.emit(nombre);
      this.nombreInput = '';
    }
  }

  cerrar(): void {
    this.nombreInput = '';
    this.cancelar.emit();
  }
}
