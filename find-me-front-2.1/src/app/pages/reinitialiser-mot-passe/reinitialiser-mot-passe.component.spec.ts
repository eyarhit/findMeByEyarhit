import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReinitialiserMotPasseComponent } from './reinitialiser-mot-passe.component';



describe('ReinitialiserMotPasseComponent', () => {
  let component: ReinitialiserMotPasseComponent;
  let fixture: ComponentFixture<ReinitialiserMotPasseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReinitialiserMotPasseComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReinitialiserMotPasseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
