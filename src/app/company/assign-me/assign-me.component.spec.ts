import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignMeComponent } from './assign-me.component';

describe('AssignMeComponent', () => {
  let component: AssignMeComponent;
  let fixture: ComponentFixture<AssignMeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssignMeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignMeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
