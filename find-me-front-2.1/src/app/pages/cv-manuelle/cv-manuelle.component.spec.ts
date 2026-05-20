import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CvManuelleComponent } from './cv-manuelle.component';

describe('CvManuelleComponent', () => {
  let component: CvManuelleComponent;
  let fixture: ComponentFixture<CvManuelleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CvManuelleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CvManuelleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
