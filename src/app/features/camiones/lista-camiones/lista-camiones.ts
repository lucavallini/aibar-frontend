import { ChangeDetectionStrategy, Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CamionesService } from '../../../core/services/camiones.service';
import { EmpresasService } from '../../../core/services/empresas.service';
import { AuthService } from '../../../core/services/auth.service';
import { Camion, CamionCreate } from '../../../core/models/camion.model';
import { Empresa } from '../../../core/models/empresa.model';
import { TablaPaginada } from '../../../shared/components/tabla-paginada/tabla-paginada';
import { Confirmar } from '../../../shared/components/confirmar/confirmar';
import { MiniModalEmpresa } from '../../../shared/components/mini-modal-empresa/mini-modal-empresa';

@Component({
  selector: 'app-lista-camiones',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TablaPaginada, Confirmar, MiniModalEmpresa],
  templateUrl: './lista-camiones.html',
  styleUrl: './lista-camiones.css'
})
export class ListaCamiones implements OnInit {
  camiones = signal<Camion[]>([]);
  empresas = signal<Empresa[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  busqueda = signal('');

  pagina = signal(1);
  totalPaginas = signal(1);
  total = signal(0);
  tamanoPagina = 20;

  modalAbierto = signal(false);
  nuevoCamion: CamionCreate = this.formularioVacio();

  modalEditarAbierto = signal(false);
  modalBajaAbierto = signal(false);
  camionSeleccionado = signal<Camion | null>(null);
  edicionCamion: Partial<CamionCreate> = {};

  miniModalEmpresaAbierto = signal(false);

  readonly = computed(() => this.authService.getRol() === 'aibar');

  constructor(
    private camionesService: CamionesService,
    private empresasService: EmpresasService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarCamiones();
  }

  nombreEmpresa(empresaId: string | null): string {
    if (!empresaId) return '-';
    const e = this.empresas().find(e => e.id === empresaId);
    return e ? e.nombre : '-';
  }

  abrirEditar(camion: Camion): void {
    this.camionSeleccionado.set(camion);
    this.edicionCamion = {
      marca: camion.marca ?? undefined,
      modelo: camion.modelo ?? undefined,
      anio: camion.anio ?? undefined,
      tipo: camion.tipo ?? undefined,
      empresa_id: camion.empresa_id ?? undefined,
    };
    this.error.set(null);
    this.modalEditarAbierto.set(true);
  }

  cerrarEditar(): void {
    this.modalEditarAbierto.set(false);
    this.camionSeleccionado.set(null);
  }

  confirmarEdicion(): void {
    const camion = this.camionSeleccionado();
    if (!camion) return;

    this.camionesService.actualizar(camion.id, this.edicionCamion).subscribe({
      next: () => {
        this.cerrarEditar();
        this.cargarCamiones();
      },
      error: () => this.error.set('No se pudo editar el camión')
    });
  }

  abrirBaja(camion: Camion): void {
    this.camionSeleccionado.set(camion);
    this.modalBajaAbierto.set(true);
  }

  cerrarBaja(): void {
    this.modalBajaAbierto.set(false);
    this.camionSeleccionado.set(null);
  }

  confirmarBaja(): void {
    const camion = this.camionSeleccionado();
    if (!camion) return;

    this.camionesService.darDeBaja(camion.id).subscribe({
      next: () => {
        this.cerrarBaja();
        this.cargarCamiones();
      },
      error: () => this.error.set('No se pudo dar de baja el camión')
    });
  }

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
    this.pagina.set(1);
    this.cargarCamiones();
  }

  cargarCamiones(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.empresasService.listar(1, 1000).subscribe({
      next: (respuesta) => this.empresas.set(respuesta.items)
    });

    this.camionesService.listar(this.pagina(), this.tamanoPagina, { busqueda: this.busqueda() || undefined }).subscribe({
      next: (respuesta) => {
        this.camiones.set(respuesta.items);
        this.total.set(respuesta.total);
        this.totalPaginas.set(respuesta.total_paginas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los camiones');
        this.cargando.set(false);
      }
    });
  }

  cambiarPagina(nueva: number): void {
    this.pagina.set(nueva);
    this.cargarCamiones();
  }

  formularioVacio(): CamionCreate {
    return { patente: '', marca: '', modelo: '', anio: undefined, tipo: '', empresa_id: undefined };
  }

  abrirModal(): void {
    this.nuevoCamion = this.formularioVacio();
    this.error.set(null);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  confirmarAlta(): void {
    if (!this.nuevoCamion.patente.trim()) {
      this.error.set('La patente es obligatoria');
      return;
    }

    this.camionesService.crear(this.nuevoCamion).subscribe({
      next: () => {
        this.cerrarModal();
        this.pagina.set(1);
        this.cargarCamiones();
      },
      error: (err) => {
        if (err.status === 400) {
          this.error.set('Ya existe un camión con esa patente');
        } else {
          this.error.set('No se pudo crear el camión');
        }
      }
    });
  }

  abrirMiniModalEmpresa(): void {
    this.error.set(null);
    this.miniModalEmpresaAbierto.set(true);
  }

  onEmpresaCreada(nombre: string): void {
    this.empresasService.crear({ nombre }).subscribe({
      next: (empresa) => {
        this.empresas.update(lista => [...lista, empresa]);
        this.nuevoCamion.empresa_id = empresa.id;
        this.miniModalEmpresaAbierto.set(false);
      },
      error: () => this.error.set('No se pudo crear la empresa')
    });
  }

  cerrarMiniModalEmpresa(): void {
    this.miniModalEmpresaAbierto.set(false);
  }
}
