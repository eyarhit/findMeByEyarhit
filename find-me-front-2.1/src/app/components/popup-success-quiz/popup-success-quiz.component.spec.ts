import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupSuccessQuizComponent } from './popup-success-quiz.component';

describe('PopupSuccessQuizComponent', () => {
  let component: PopupSuccessQuizComponent;
  let fixture: ComponentFixture<PopupSuccessQuizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PopupSuccessQuizComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PopupSuccessQuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
