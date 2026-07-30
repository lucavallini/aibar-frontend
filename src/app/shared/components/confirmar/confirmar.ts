import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-confirmar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './confirmar.html',
  styleUrl: './confirmar.css'
})
export class Confirmar {
  @Input() titulo = '¿Confirmás esta acción?';
  @Input() mensaje = 'Esta acción no se puede deshacer.';
  @Input() textoConfirmar = 'Confirmar';
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
}