import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizSeulepageComponent } from './quiz-seulepage.component';

describe('QuizSeulepageComponent', () => {
  let component: QuizSeulepageComponent;
  let fixture: ComponentFixture<QuizSeulepageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QuizSeulepageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QuizSeulepageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
