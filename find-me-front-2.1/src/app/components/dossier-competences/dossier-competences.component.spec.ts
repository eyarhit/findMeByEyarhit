import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DossierCompetencesComponent } from './dossier-competences.component';

describe('DossierCompetencesComponent', () => {
  let component: DossierCompetencesComponent;
  let fixture: ComponentFixture<DossierCompetencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DossierCompetencesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DossierCompetencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
