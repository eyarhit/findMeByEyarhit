import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformationCvComponent } from './information-cv.component';

describe('InformationCvComponent', () => {
  let component: InformationCvComponent;
  let fixture: ComponentFixture<InformationCvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InformationCvComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InformationCvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
