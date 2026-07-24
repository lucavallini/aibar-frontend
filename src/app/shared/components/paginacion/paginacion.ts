import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-paginacion',
  standalone: true,
  imports: [],
  templateUrl: './paginacion.html',
  styleUrl: './paginacion.css'
})
export class Paginacion {
  @Input() pagina = 1;
  @Input() totalPaginas = 1;
  @Input() total = 0;
  @Output() cambioPagina = new EventEmitter<number>();

  irAPagina(nueva: number): void {
    if (nueva < 1 || nueva > this.totalPaginas || nueva === this.pagina) return;
    this.cambioPagina.emit(nueva);
  }
}