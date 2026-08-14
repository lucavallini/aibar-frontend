import { ChangeDetectionStrategy, Component, OnInit, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ChoferesService } from '../../../core/services/choferes.service';
import { ObservacionesService } from '../../../core/services/observaciones.service';
import { Chofer } from '../../../core/models/chofer.model';
import { Empresa } from '../../../core/models/empresa.model';
import { Observacion } from '../../../core/models/observacion.model';
import { Modal } from '../../../shared/components/modal/modal';
import { EstadoCarga } from '../../../shared/components/estado-carga/estado-carga';
import { BuscadorSelect } from '../../../shared/components/buscador-select/buscador-select';
import { obtenerNombreEmpresa } from '../../../core/utils/entidades';

@Component({
  selector: 'app-observaciones-mes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Modal, EstadoCarga, BuscadorSelect],
  templateUrl: './observaciones-mes.html',
  styleUrl: './observaciones-mes.css'
})
export class ObservacionesMesComponent implements OnInit {
  empresas = input<Empresa[]>([]);
  cerrado = output<void>();

  choferes = signal<Chofer[]>([]);
  observacionesPorChofer = signal<Record<string, Observacion>>({});
  cargando = signal(true);
  error = signal<string | null>(null);
  busqueda = signal('');
  filtroEmpresaId = signal('');

  constructor(
    private choferesService: ChoferesService,
    private observacionesService: ObservacionesService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    forkJoin({
      choferes: this.choferesService.listar(1, 500),
      observaciones: this.observacionesService.listarMesActual(),
    }).subscribe({
      next: ({ choferes, observaciones }) => {
        this.choferes.set(choferes.items);
        const mapa: Record<string, Observacion> = {};
        observaciones.forEach(obs => mapa[obs.chofer_id] = obs);
        this.observacionesPorChofer.set(mapa);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los choferes');
        this.cargando.set(false);
      }
    });
  }

  nombreEmpresa(empresaId: string | null): string {
    return obtenerNombreEmpresa(this.empresas(), empresaId);
  }

  observacionDe(choferId: string): Observacion | null {
    return this.observacionesPorChofer()[choferId] ?? null;
  }

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
  }

  seleccionarEmpresa(empresa: Empresa): void {
    this.filtroEmpresaId.set(empresa.id);
  }

  limpiarEmpresa(): void {
    this.filtroEmpresaId.set('');
  }

  choferesFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const empresa = this.filtroEmpresaId();
    const observaciones = this.observacionesPorChofer();
    return this.choferes().filter(chofer => {
      if (!observaciones[chofer.id]) return false;
      if (empresa && chofer.empresa_id !== empresa) return false;
      if (texto && !chofer.nombre_completo.toLowerCase().includes(texto)) return false;
      return true;
    });
  });
}
