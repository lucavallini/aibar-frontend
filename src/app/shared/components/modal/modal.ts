import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, input, OnDestroy, output, viewChild } from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './modal.html',
  styleUrl: './modal.css'
})
export class Modal implements AfterViewInit, OnDestroy {
  titulo = input<string | undefined>(undefined);
  tamano = input<'chico' | 'normal' | 'grande'>('normal');
  cerrable = input(true);
  cerrado = output<void>();

  private panel = viewChild<ElementRef<HTMLDivElement>>('panel');
  private escSub: Subscription;

  constructor() {
    this.escSub = fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(filter(e => e.key === 'Escape'))
      .subscribe(() => {
        if (this.cerrable()) this.cerrado.emit();
      });
  }

  ngOnDestroy(): void {
    this.escSub.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.panel()?.nativeElement.focus();
  }

  cerrar(): void {
    if (this.cerrable()) this.cerrado.emit();
  }
}
