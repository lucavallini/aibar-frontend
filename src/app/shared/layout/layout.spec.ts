import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Layout } from './layout';

describe('Layout', () => {
  let component: Layout;
  let fixture: ComponentFixture<Layout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Layout],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Layout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('el menú se puede ocultar y volver a mostrar', () => {
    const inicial = component.sidebarAbierta();

    component.toggleSidebar();
    expect(component.sidebarAbierta()).toBe(!inicial);

    component.toggleSidebar();
    expect(component.sidebarAbierta()).toBe(inicial);
  });

  it('la clase del menú acompaña al estado', () => {
    const menu = () => fixture.nativeElement.querySelector('.sidebar');

    component.sidebarAbierta.set(true);
    fixture.detectChanges();
    expect(menu().classList.contains('abierta')).toBe(true);

    component.sidebarAbierta.set(false);
    fixture.detectChanges();
    expect(menu().classList.contains('abierta')).toBe(false);
  });
});
