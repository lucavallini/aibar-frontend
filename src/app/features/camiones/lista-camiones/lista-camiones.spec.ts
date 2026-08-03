import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ListaCamiones } from './lista-camiones';

describe('ListaCamiones', () => {
  let component: ListaCamiones;
  let fixture: ComponentFixture<ListaCamiones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaCamiones],
      providers: [provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaCamiones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
