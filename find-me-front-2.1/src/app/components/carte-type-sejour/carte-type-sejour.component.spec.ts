import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarteTypeSejourComponent } from './carte-type-sejour.component';

describe('CarteTypeSejourComponent', () => {
  let component: CarteTypeSejourComponent;
  let fixture: ComponentFixture<CarteTypeSejourComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarteTypeSejourComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CarteTypeSejourComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
