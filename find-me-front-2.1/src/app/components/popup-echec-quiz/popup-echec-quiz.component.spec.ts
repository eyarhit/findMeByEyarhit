import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupEchecQuizComponent } from './popup-echec-quiz.component';

describe('PopupEchecQuizComponent', () => {
  let component: PopupEchecQuizComponent;
  let fixture: ComponentFixture<PopupEchecQuizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PopupEchecQuizComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PopupEchecQuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
