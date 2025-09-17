import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewWorkflowmasterSetupComponent } from './new-workflowmaster-setup.component';

describe('NewWorkflowmasterSetupComponent', () => {
  let component: NewWorkflowmasterSetupComponent;
  let fixture: ComponentFixture<NewWorkflowmasterSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewWorkflowmasterSetupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewWorkflowmasterSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
