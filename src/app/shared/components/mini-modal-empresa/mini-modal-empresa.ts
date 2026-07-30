import { ChangeDetectionStrategy, Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mini-modal-empresa',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './mini-modal-empresa.html',
  styleUrl: './mini-modal-empresa.css'
})
export class MiniModalEmpresa {
  nombreInput = '';

  @Output() empresaCreada = new EventEmitter<string>();
  @Output() cancelar = new EventEmitter<void>();

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
