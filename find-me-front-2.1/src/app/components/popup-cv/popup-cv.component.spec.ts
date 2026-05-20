import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupCvComponent } from './popup-cv.component';

describe('PopupCvComponent', () => {
  let component: PopupCvComponent;
  let fixture: ComponentFixture<PopupCvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PopupCvComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PopupCvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
