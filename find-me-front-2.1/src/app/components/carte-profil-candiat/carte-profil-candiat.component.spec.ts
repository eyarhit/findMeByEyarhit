import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarteProfilCandiatComponent } from './carte-profil-candiat.component';

describe('CarteProfilCandiatComponent', () => {
  let component: CarteProfilCandiatComponent;
  let fixture: ComponentFixture<CarteProfilCandiatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CarteProfilCandiatComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CarteProfilCandiatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
