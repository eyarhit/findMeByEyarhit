import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DossierCompetenceComponent } from './dossier-competence.component';

describe('DossierCompetenceComponent', () => {
  let component: DossierCompetenceComponent;
  let fixture: ComponentFixture<DossierCompetenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DossierCompetenceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DossierCompetenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
