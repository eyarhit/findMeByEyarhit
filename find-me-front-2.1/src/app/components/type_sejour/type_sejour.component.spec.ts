import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypeSejourComponent } from './type_sejour.component';

describe('TypeSejourComponent', () => {
  let component: TypeSejourComponent;
  let fixture: ComponentFixture<TypeSejourComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TypeSejourComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TypeSejourComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
