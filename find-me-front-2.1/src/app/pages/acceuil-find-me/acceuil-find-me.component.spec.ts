import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcceuilFindMeComponent } from './Acceuil-find-me.component';



describe('AcceuilFindMeComponent', () => {
  let component: AcceuilFindMeComponent;
  let fixture: ComponentFixture<AcceuilFindMeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AcceuilFindMeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AcceuilFindMeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
