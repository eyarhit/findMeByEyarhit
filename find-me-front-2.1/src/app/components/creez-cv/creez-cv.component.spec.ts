import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreezCvComponent } from './creez-cv.component';

describe('CreezCvComponent', () => {
  let component: CreezCvComponent;
  let fixture: ComponentFixture<CreezCvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreezCvComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreezCvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

