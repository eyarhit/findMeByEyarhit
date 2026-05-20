import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublierContratComponent } from './publier_contrat.component';

describe('PublierContratComponent', () => {
  let component: PublierContratComponent;
  let fixture: ComponentFixture<PublierContratComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublierContratComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PublierContratComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
