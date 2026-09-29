import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { NormalizacionService } from '../../../core/services/normalizacion.service';
import { CampoNormalizable, Sugerencia } from '../../../core/models/normalizacion.model';

/** Lo que se tarda en dejar de tipear; más corto consulta a cada tecla. */
const ESPERA_MS = 400;

/**
 * Aviso de escritura para un campo de texto libre.
 *
 * Muestra la forma correcta según el catálogo y la aplica si el usuario la
 * acepta. Nunca bloquea: si el valor escrito es un lugar o una carga que no
 * está cargada todavía, se guarda igual.
 */
@Component({
  selector: 'app-sugerencia-campo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (sugerencia()?.sugerido; as correcto) {
      <p class="sugerencia">
        <span
          >¿Querés decir <strong>{{ correcto }}</strong
          >?</span
        >
        <button type="button" (click)="aceptada.emit(correcto)">Usar este</button>
      </p>
    }
  `,
  styles: [
    `
      .sugerencia {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin: 0.25rem 0 0;
        font-size: 0.85rem;
        color: var(--color-texto-suave, #555);
      }
      .sugerencia button {
        padding: 0.15rem 0.5rem;
        font-size: 0.8rem;
        cursor: pointer;
      }
    `,
  ],
})
export class SugerenciaCampoComponent {
  private normalizacion = inject(NormalizacionService);

  campo = input.required<CampoNormalizable>();
  texto = input.required<string>();

  /** El valor correcto, para que el formulario lo escriba en su propio campo. */
  aceptada = output<string>();

  protected sugerencia = toSignal<Sugerencia | undefined>(
    toObservable(this.texto).pipe(
      debounceTime(ESPERA_MS),
      distinctUntilChanged(),
      // switchMap descarta la respuesta de lo que el usuario ya dejó de escribir.
      switchMap((texto) => this.normalizacion.sugerir(this.campo(), texto ?? '')),
    ),
  );
}
