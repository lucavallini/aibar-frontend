import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ListaChoferesComponent } from './lista-choferes';

describe('ListaChoferes', () => {
  let component: ListaChoferesComponent;
  let fixture: ComponentFixture<ListaChoferesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaChoferesComponent],
      providers: [provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaChoferesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
