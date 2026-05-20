import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompteCreerWithSucessComponent } from './CompteCreerWithSucess.component';

describe('CompteCreerWithSucessComponent', () => {
  let component: CompteCreerWithSucessComponent;
  let fixture: ComponentFixture<CompteCreerWithSucessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CompteCreerWithSucessComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CompteCreerWithSucessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
