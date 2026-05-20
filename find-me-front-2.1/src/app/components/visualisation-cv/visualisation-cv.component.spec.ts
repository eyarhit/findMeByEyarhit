import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualisationCvComponent } from './visualisation-cv.component';

describe('VisualisationCvComponent', () => {
  let component: VisualisationCvComponent;
  let fixture: ComponentFixture<VisualisationCvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VisualisationCvComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VisualisationCvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
