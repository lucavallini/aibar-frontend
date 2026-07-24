import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaCombustible } from './lista-combustible';

describe('ListaCombustible', () => {
  let component: ListaCombustible;
  let fixture: ComponentFixture<ListaCombustible>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaCombustible],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaCombustible);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
