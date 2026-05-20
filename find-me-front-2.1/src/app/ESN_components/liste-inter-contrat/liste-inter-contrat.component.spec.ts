import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeInterContratComponent } from './liste-inter-contrat.component';

describe('ListeInterContratComponent', () => {
  let component: ListeInterContratComponent;
  let fixture: ComponentFixture<ListeInterContratComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeInterContratComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListeInterContratComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
