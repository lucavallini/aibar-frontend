import { ChangeDetectionStrategy, Component, input, output, signal, computed, HostListener, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-buscador-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './buscador-select.html',
  styleUrl: './buscador-select.css'
})
export class BuscadorSelect {
  items = input<any[]>([]);
  selectedId = input<string | undefined>(undefined);
  displayKey = input('nombre_completo');
  idKey = input('id');
  placeholder = input('Elegí...');
  mostrarLimpiar = input(false);
  textoLimpiar = input('Todos');

  selectionChange = output<any>();
  cleanSelection = output<void>();

  dropdownAbierta = signal(false);
  busqueda = signal('');

  constructor(private el: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.dropdownAbierta.set(false);
      this.busqueda.set('');
    }
  }

  itemsFiltrados = computed(() => {
    const filtro = this.busqueda().toLowerCase();
    if (!filtro) return this.items();
    return this.items().filter(item => {
      const valor = String(item[this.displayKey()] ?? '').toLowerCase();
      return valor.includes(filtro);
    });
  });

  displayText = computed(() => {
    const id = this.selectedId();
    if (!id) return this.placeholder();
    const item = this.items().find(i => String(i[this.idKey()]) === id);
    return item ? String(item[this.displayKey()] ?? '') : this.placeholder();
  });

  abrir(event: MouseEvent): void {
    event.stopPropagation();
    this.dropdownAbierta.update(v => !v);
    if (!this.dropdownAbierta()) return;
    this.busqueda.set('');
    setTimeout(() => {
      const input = (event.currentTarget as HTMLElement)?.parentElement?.querySelector('input');
      input?.focus();
    });
  }

  cerrar(): void {
    this.dropdownAbierta.set(false);
    this.busqueda.set('');
  }

  seleccionar(item: any): void {
    this.selectionChange.emit(item);
    this.dropdownAbierta.set(false);
    this.busqueda.set('');
  }

  limpiar(): void {
    this.cleanSelection.emit();
    this.dropdownAbierta.set(false);
    this.busqueda.set('');
  }

  onInputClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  itemId(item: any): string {
    return String(item[this.idKey()] ?? '');
  }
}
