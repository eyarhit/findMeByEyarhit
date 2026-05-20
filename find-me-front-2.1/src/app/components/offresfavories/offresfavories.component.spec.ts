import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OffresfavoriesComponent } from './offresfavories.component';

describe('OffresfavoriesComponent', () => {
  let component: OffresfavoriesComponent;
  let fixture: ComponentFixture<OffresfavoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OffresfavoriesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OffresfavoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
