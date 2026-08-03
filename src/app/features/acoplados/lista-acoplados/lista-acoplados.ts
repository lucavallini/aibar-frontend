import { ChangeDetectionStrategy, Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { AcopladosService } from '../../../core/services/acoplado.service';
import { EmpresasService } from '../../../core/services/empresas.service';
import { Acoplado, AcopladoCreate } from '../../../core/models/acoplado.model';
import { Empresa } from '../../../core/models/empresa.model';
import { labelEstadoAcoplado } from '../../../core/utils/estado-labels';
import { TablaPaginada } from '../../../shared/components/tabla-paginada/tabla-paginada';
import { Confirmar } from '../../../shared/components/confirmar/confirmar';
import { MiniModalEmpresa } from '../../../shared/components/mini-modal-empresa/mini-modal-empresa';

@Component({
  selector: 'app-lista-acoplados',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TablaPaginada, Confirmar, MiniModalEmpresa],
  templateUrl: './lista-acoplados.html',
  styleUrl: './lista-acoplados.css'
})
export class ListaAcoplados implements OnInit {
  acopladosList = signal<Acoplado[]>([]);
  empresas = signal<Empresa[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  busqueda = signal('');

  pagina = signal(1);
  totalPaginas = signal(1);
  total = signal(0);
  tamanoPagina = 20;

  modalAbierto = signal(false);
  nuevoAcoplado: AcopladoCreate = this.formularioVacio();

  modalEditarAbierto = signal(false);
  modalBajaAbierto = signal(false);
  acopladoSeleccionado = signal<Acoplado | null>(null);
  edicionAcoplado: Partial<AcopladoCreate> = {};

  miniModalEmpresaAbierto = signal(false);

  readonly = computed(() => this.authService.getRol() === 'aibar');

  constructor(
    private acopladosService: AcopladosService,
    private empresasService: EmpresasService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarAcoplados();
  }

  nombreEmpresa(empresaId: string | null): string {
    if (!empresaId) return '-';
    const e = this.empresas().find(e => e.id === empresaId);
    return e ? e.nombre : '-';
  }

  labelEstadoAcoplado(estado: string): string {
    return labelEstadoAcoplado(estado);
  }

  abrirEditar(acoplado: Acoplado): void {
    this.acopladoSeleccionado.set(acoplado);
    this.edicionAcoplado = {
      patente: acoplado.patente,
      tipo: acoplado.tipo ?? undefined,
      empresa_id: acoplado.empresa_id ?? undefined,
    };
    this.error.set(null);
    this.modalEditarAbierto.set(true);
  }

  cerrarEditar(): void {
    this.modalEditarAbierto.set(false);
    this.acopladoSeleccionado.set(null);
  }

  confirmarEdicion(): void {
    const acoplado = this.acopladoSeleccionado();
    if (!acoplado) return;

    this.acopladosService.actualizar(acoplado.id, this.edicionAcoplado).subscribe({
      next: () => {
        this.cerrarEditar();
        this.cargarAcoplados();
      },
      error: () => this.error.set('No se pudo editar el acoplado')
    });
  }

  abrirBaja(acoplado: Acoplado): void {
    this.acopladoSeleccionado.set(acoplado);
    this.modalBajaAbierto.set(true);
  }

  cerrarBaja(): void {
    this.modalBajaAbierto.set(false);
    this.acopladoSeleccionado.set(null);
  }

  confirmarBaja(): void {
    const acoplado = this.acopladoSeleccionado();
    if (!acoplado) return;

    this.acopladosService.darDeBaja(acoplado.id).subscribe({
      next: () => {
        this.cerrarBaja();
        this.cargarAcoplados();
      },
      error: () => this.error.set('No se pudo dar de baja el acoplado')
    });
  }

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
    this.pagina.set(1);
    this.cargarAcoplados();
  }

  cargarAcoplados(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.empresasService.listar(1, 1000).subscribe({
      next: (respuesta) => this.empresas.set(respuesta.items)
    });

    this.acopladosService.listar(this.pagina(), this.tamanoPagina, { busqueda: this.busqueda() || undefined }).subscribe({
      next: (respuesta) => {
        this.acopladosList.set(respuesta.items);
        this.total.set(respuesta.total);
        this.totalPaginas.set(respuesta.total_paginas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los acoplados');
        this.cargando.set(false);
      }
    });
  }

  cambiarPagina(nueva: number): void {
    this.pagina.set(nueva);
    this.cargarAcoplados();
  }

  formularioVacio(): AcopladoCreate {
    return { patente: '', tipo: '', empresa_id: undefined };
  }

  abrirModal(): void {
    this.nuevoAcoplado = this.formularioVacio();
    this.error.set(null);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  confirmarAlta(): void {
    if (!this.nuevoAcoplado.patente.trim()) {
      this.error.set('La patente es obligatoria');
      return;
    }

    this.acopladosService.crear(this.nuevoAcoplado).subscribe({
      next: () => {
        this.cerrarModal();
        this.pagina.set(1);
        this.cargarAcoplados();
      },
      error: (err) => {
        if (err.status === 400) {
          this.error.set('Ya existe un acoplado con esa patente');
        } else {
          this.error.set('No se pudo crear el acoplado');
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
        this.nuevoAcoplado.empresa_id = empresa.id;
        this.miniModalEmpresaAbierto.set(false);
      },
      error: () => this.error.set('No se pudo crear la empresa')
    });
  }

  cerrarMiniModalEmpresa(): void {
    this.miniModalEmpresaAbierto.set(false);
  }
}
