import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterCandidatTunisieComponent } from './register-candidat-tunisie.component';

describe('RegisterCandidatTunisieComponent', () => {
  let component: RegisterCandidatTunisieComponent;
  let fixture: ComponentFixture<RegisterCandidatTunisieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegisterCandidatTunisieComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegisterCandidatTunisieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
