import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-confirmar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Modal],
  templateUrl: './confirmar.html',
  styleUrl: './confirmar.css'
})
export class Confirmar {
  titulo = input('¿Confirmás esta acción?');
  mensaje = input('Esta acción no se puede deshacer.');
  textoConfirmar = input('Confirmar');
  confirmar = output<void>();
  cancelar = output<void>();
}