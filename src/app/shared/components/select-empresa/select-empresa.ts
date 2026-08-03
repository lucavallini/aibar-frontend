import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Empresa } from '../../../core/models/empresa.model';

@Component({
  selector: 'app-select-empresa',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './select-empresa.html',
})
export class SelectEmpresa {
  empresas = input<Empresa[]>([]);
  value = input<string | null | undefined>(undefined);
  readonly = input(false);
  valueChange = output<string | null | undefined>();
  crear = output<void>();
}
